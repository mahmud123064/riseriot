const { AndroidConfig } = require('expo/config-plugins')

function withPoseCamera(config) {
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.CAMERA',
  ])
}

module.exports = withPoseCamera
