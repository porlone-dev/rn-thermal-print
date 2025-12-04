package com.pinmi.react.printer

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RNPrinterTurboPackage : TurboReactPackage() {
    
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            RNBLEPrinterTurboModule.NAME -> RNBLEPrinterTurboModule(reactContext)
            else -> null
        }
    }
    
    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            mapOf(
                RNBLEPrinterTurboModule.NAME to ReactModuleInfo(
                    RNBLEPrinterTurboModule.NAME,
                    RNBLEPrinterTurboModule::class.java.name,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    true, // hasConstants
                    false, // isCxxModule
                    isTurboModule // isTurboModule
                )
            )
        }
    }
}
