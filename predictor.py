import yaml
import torch
from IW_crack.data.preprocess_pipeline import SlidingWindowCrop
class Predictor:
    def __init__(self, model_path: str, model_settings_path: str):
        """Initializes the Predictor with a model and its settings.

        :param model_path: Path to the model file
        :type model_path: str
        :param model_settings_path: Path to the YAML file containing model settings
        :type model_settings_path: str
        """
        try:
            
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            print(f"Using device: {self.device}")
            self.model_settings = self._load_model_settings(model_settings_path)
            self.model = self._init_model(self.model_settings['model_type'], model_state_dict=None)
            self.model.load_state_dict(torch.load(model_path, map_location='cpu'))
            self.model.eval()
            self.predictor = SlidingWindowCrop(
                window_size=self.model_settings['window_size'],
                overlap=self.model_settings['overlap'],
            )
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Predictor: {e}")

    def __call__(self, image: torch.Tensor) -> torch.Tensor:
        """Runs the model on the input tensor.

        :param image: Input tensor to the model
        :type image: torch.Tensor
        :return: Model output
        :rtype: torch.Tensor
        """
        with torch.no_grad():
            output = self.predictor(self.model, image)
            return output.cpu().numpy()

    def _load_model_settings(self, file_path):
        """Loads model settings from a YAML file.

        :param file_path: Path to the YAML file containing model settings
        :type file_path: str
        :return: Dictionary containing model settings
        :rtype: dict
        """
        
        try:
            with open(file_path, 'r') as file:
                settings = yaml.safe_load(file)
                return settings
        except Exception as e:
            raise RuntimeError(f"Failed to load model settings: {e}")
        
    def _init_model(self, model_type:str, model_state_dict:dict):
        model_type = model_type.lower()
        if model_type == 'hnet':
            from IW_crack.model.hnet import HNet
            model = HNet()
        elif model_type == 'unet':
            from IW_crack.model.unet import UNet
            model = UNet()
        elif model_type == 'deepcrack':
            from IW_crack.model.deepcrack import DeepCrack
            model = DeepCrack()
        elif model_type == 'segformer':
            from IW_crack.model.segformer import SegFormer
            model = SegFormer(pretrained=True)
        elif model_type == 'attention_unet':
            from IW_crack.model.attention_unet import AttentionUNet
            model = AttentionUNet()
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        if model_state_dict:
            try:
                model.load_state_dict(model_state_dict)
            except Exception as e:
                raise RuntimeError(f"Failed to load model state dict: {e}")
        return model.to(self.device)

if __name__ == "__main__":
    # Test Functionality
    import cv2
    image_path = '137.jpg'
    predictor = Predictor(model_path='IW_crack/hnet.pth', model_settings_path='model_settings.yaml')
    image = cv2.imread(image_path)
    output = predictor(image)
    import matplotlib.pyplot as plt
    plt.imshow(output, cmap='gray')
    plt.show()