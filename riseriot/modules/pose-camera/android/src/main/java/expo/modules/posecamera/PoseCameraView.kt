package expo.modules.posecamera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.SystemClock
import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

private const val TAG = "PoseCameraView"

@SuppressLint("ViewConstructor")
class PoseCameraView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {

  private val onPose by EventDispatcher<Map<String, Any>>()

  private val previewView = PreviewView(context).apply {
    implementationMode = PreviewView.ImplementationMode.PERFORMANCE
    scaleType = PreviewView.ScaleType.FILL_CENTER
  }

  private var cameraProvider: ProcessCameraProvider? = null
  private var analysisExecutor: ExecutorService? = null
  private var poseLandmarker: PoseLandmarker? = null

  private val isEnabledFlag = AtomicBoolean(true)
  private var lastAnalysisTimestamp = 0L

  private val lifecycleOwner: LifecycleOwner?
    get() = (appContext.currentActivity as? LifecycleOwner)
      ?: (context as? LifecycleOwner)

  init {
    previewView.setOnHierarchyChangeListener(object : OnHierarchyChangeListener {
      override fun onChildViewRemoved(parent: android.view.View?, child: android.view.View?) = Unit
      override fun onChildViewAdded(parent: android.view.View?, child: android.view.View?) {
        parent?.measure(
          MeasureSpec.makeMeasureSpec(measuredWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(measuredHeight, MeasureSpec.EXACTLY)
        )
        parent?.layout(0, 0, parent.measuredWidth, parent.measuredHeight)
      }
    })

    addView(
      previewView,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )

    initPoseLandmarker()
  }

  fun setPoseTrackingEnabled(enabled: Boolean) {
    isEnabledFlag.set(enabled)
  }

  private fun initPoseLandmarker() {
    try {
      val baseOptions = BaseOptions.builder()
        .setModelAssetPath("pose_landmarker_lite.task")
        .build()

      val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setMinPoseDetectionConfidence(0.45f)
        .setMinTrackingConfidence(0.45f)
        .setMinPosePresenceConfidence(0.45f)
        .setRunningMode(RunningMode.IMAGE)
        .build()

      poseLandmarker = PoseLandmarker.createFromOptions(context, options)
      Log.i(TAG, "PoseLandmarker initialized successfully")
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to initialize PoseLandmarker", e)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    startCamera()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    stopCamera()
  }

  private fun startCamera() {
    val executor = Executors.newSingleThreadExecutor()
    analysisExecutor = executor

    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    cameraProviderFuture.addListener({
      try {
        val provider = cameraProviderFuture.get()
        cameraProvider = provider
        bindCamera(provider, executor)
      } catch (e: Throwable) {
        Log.e(TAG, "Failed to obtain ProcessCameraProvider", e)
      }
    }, ContextCompat.getMainExecutor(context))
  }

  private fun bindCamera(provider: ProcessCameraProvider, executor: ExecutorService) {
    val owner = lifecycleOwner ?: run {
      Log.w(TAG, "No LifecycleOwner found; cannot bind camera")
      return
    }

    try {
      provider.unbindAll()

      val preview = Preview.Builder().build().also {
        it.setSurfaceProvider(previewView.surfaceProvider)
      }

      val imageAnalysis = ImageAnalysis.Builder()
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
        .build()

      imageAnalysis.setAnalyzer(executor) { imageProxy ->
        analyzeFrame(imageProxy)
      }

      val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
      provider.bindToLifecycle(owner, cameraSelector, preview, imageAnalysis)
      Log.i(TAG, "Camera bound to front lens successfully")
    } catch (e: Throwable) {
      Log.e(TAG, "Error binding camera to lifecycle", e)
    }
  }

  private fun analyzeFrame(imageProxy: ImageProxy) {
    try {
      if (!isEnabledFlag.get() || poseLandmarker == null) {
        return
      }

      val now = SystemClock.uptimeMillis()
      // Throttle to ~13-14 FPS (75ms) for responsive pose tracking with minimal CPU load
      if (now - lastAnalysisTimestamp < 75) {
        return
      }
      lastAnalysisTimestamp = now

      val bitmap = imageProxy.toBitmap()
      val rotationDegrees = imageProxy.imageInfo.rotationDegrees
      val rotatedBitmap = if (rotationDegrees != 0) {
        val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
        Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
      } else {
        bitmap
      }

      val mpImage = BitmapImageBuilder(rotatedBitmap).build()
      val result = poseLandmarker?.detect(mpImage)

      val landmarksList = ArrayList<Map<String, Any>>()
      if (result != null && result.landmarks().isNotEmpty()) {
        val firstPose = result.landmarks()[0]
        for (landmark in firstPose) {
          val visibility = try {
            if (landmark.visibility().isPresent) landmark.visibility().get() else 0.5f
          } catch (_: Throwable) {
            0.5f
          }

          landmarksList.add(
            mapOf(
              "x" to landmark.x(),
              "y" to landmark.y(),
              "z" to landmark.z(),
              "visibility" to visibility
            )
          )
        }
      }

      post {
        onPose(mapOf("landmarks" to landmarksList))
      }
    } catch (e: Throwable) {
      Log.e(TAG, "Error during pose analysis frame", e)
    } finally {
      imageProxy.close()
    }
  }

  private fun stopCamera() {
    try {
      cameraProvider?.unbindAll()
      cameraProvider = null
    } catch (e: Throwable) {
      Log.e(TAG, "Error unbinding camera", e)
    }

    try {
      analysisExecutor?.shutdown()
      analysisExecutor = null
    } catch (e: Throwable) {
      Log.e(TAG, "Error shutting down analysis executor", e)
    }

    try {
      poseLandmarker?.close()
      poseLandmarker = null
    } catch (e: Throwable) {
      Log.e(TAG, "Error closing PoseLandmarker", e)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    measureChild(previewView, widthMeasureSpec, heightMeasureSpec)
    setMeasuredDimension(
      ViewGroup.resolveSize(previewView.measuredWidth, widthMeasureSpec),
      ViewGroup.resolveSize(previewView.measuredHeight, heightMeasureSpec)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val width = right - left
    val height = bottom - top
    previewView.layout(0, 0, width, height)
  }
}
