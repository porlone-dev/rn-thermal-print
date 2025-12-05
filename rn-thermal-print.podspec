require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']

  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platforms    = { :ios => "12.4" }

  s.source       = { :git => "https://github.com/porlone-dev/rn-thermal-print", :tag => "v#{s.version}" }
  s.source_files  = "ios/**/*.{h,m}"
  s.requires_arc = true
  s.ios.vendored_libraries = "ios/PrinterSDK/libPrinterSDK.a"
  
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '"${PROJECT_DIR}/PrinterSDK"/**',
    'DEFINES_MODULE' => 'YES'
  }

  # Use install_modules_dependencies helper for React Native >= 0.71.0
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
