import os
import folder_paths
import comfy.samplers

VISUAL_SEP = "\u29F5"

class AnyType(str):
    def __ne__(self, __value):
        return False
any_type = AnyType("*")

# --------------------------------------------------------------------------------
# ノードクラス定義
# --------------------------------------------------------------------------------

class SimpleSwitch:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "value": ("BOOLEAN", {"default": True}),
            },
        }

    RETURN_TYPES = (any_type, )
    RETURN_NAMES = ("On/Off", )
    FUNCTION = "get_value"
    CATEGORY = "utils/simple"

    def get_value(self, value):
        if value:
            return ("On", )
        else:
            return ("Off", )


class DynamicFolderLoraSelector:
    @classmethod
    def INPUT_TYPES(s):
        raw_list = folder_paths.get_filename_list("loras")
        
        mapped_list = [x.replace("\\", VISUAL_SEP).replace("/", VISUAL_SEP) for x in raw_list]
        
        return {
            "required": {
                "lora_name": (mapped_list, ),
            },
        }

    RETURN_TYPES = (any_type,)
    RETURN_NAMES = ("lora_name",)
    FUNCTION = "get_name"
    CATEGORY = "utils/simple"

    def get_name(self, lora_name):
        if lora_name:
            clean_name = lora_name.replace(VISUAL_SEP, os.sep)
            return (clean_name,)
        return (lora_name,)

class SimpleSamplerSelector:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "sampler_name": (comfy.samplers.KSampler.SAMPLERS, ),
            },
        }

    RETURN_TYPES = (any_type,)
    RETURN_NAMES = ("sampler_name",)
    FUNCTION = "get_name"
    CATEGORY = "utils/simple"

    def get_name(self, sampler_name):
        return (sampler_name,)


class SimpleSchedulerSelector:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "scheduler": (comfy.samplers.KSampler.SCHEDULERS, ),
            },
        }

    RETURN_TYPES = (any_type,)
    RETURN_NAMES = ("scheduler",)
    FUNCTION = "get_name"
    CATEGORY = "utils/simple"

    def get_name(self, scheduler):
        return (scheduler,)
    
class ModelSamplingDiscreteSelector:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "sampling": (["eps", "v_prediction", "lcm", "x0"], {"default": "eps"}),
                "zsnr": ("BOOLEAN", {"default": False}),
            },
        }

    RETURN_TYPES = (any_type, any_type)
    RETURN_NAMES = ("sampling", "zsnr")
    FUNCTION = "get_values"
    CATEGORY = "utils/simple"

    def get_values(self, sampling, zsnr):
        return (sampling, zsnr)

# --------------------------------------------------------------------------------
# ノード登録
# --------------------------------------------------------------------------------
NODE_CLASS_MAPPINGS = {
    "SimpleSwitch": SimpleSwitch,
    "SimpleSamplerSelector": SimpleSamplerSelector,
    "SimpleSchedulerSelector": SimpleSchedulerSelector,
    "DynamicFolderLoraSelector": DynamicFolderLoraSelector,
    "ModelSamplingDiscreteSelector": ModelSamplingDiscreteSelector
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DynamicFolderLoraSelector": "Dynamic LoRA Selector",
    "SimpleSwitch": "Simple Switch (Universal)",
    "SimpleSamplerSelector": "Simple Sampler",
    "SimpleSchedulerSelector": "Simple Scheduler",
    "ModelSamplingDiscreteSelector": "Model Sampling Discrete Settings"
}

NODE_DIR = os.path.dirname(os.path.realpath(__file__))
WEB_DIRECTORY = os.path.join(NODE_DIR, "web")

