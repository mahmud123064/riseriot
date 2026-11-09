package expo.modules.posecamera

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PoseCameraModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PoseCamera")

    View(PoseCameraView::class) {
      Events("onPose")

      Prop("enabled") { view: PoseCameraView, enabled: Boolean ->
        view.setPoseTrackingEnabled(enabled)
      }
    }
  }
}
