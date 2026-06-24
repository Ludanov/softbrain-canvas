# Vector Magic AI Models

This directory contains ONNX models for AI-powered image processing.

## Required Models

| Model | Filename | Size | Purpose |
|-------|----------|------|---------|
| PiDiNet | `pidinet.onnx` | ~7 MB | Edge detection for clean vector outlines |
| U²-Net (Portrait mode) | `u2netp.onnx` | ~4 MB | Background removal / subject extraction |
| AnimeGAN v2 | `animegan_v2.onnx` | ~8 MB | Style harmonization for artistic vectorization |
| DeepLab v3 | `deeplabv3.onnx` | ~25 MB | Semantic segmentation for smart layers |

## Download Script

Run the following script to download all required models:

```bash
cd frontend/public/models
./download-models.sh
```

## Manual Download

If the automatic download fails, you can manually download models from:

### PiDiNet (Edge Detection)
- Source: https://github.com/zhuqingsong/pidinet
- Convert to ONNX using the official conversion scripts

### U²-Net Portrait Mode (Background Removal)
- Download: https://github.com/xuebinqin/U-2-Net
- The portrait mode model (u2netp) is optimized for speed

### AnimeGAN v2 (Style Harmonization)
- Source: https://github.com/TachibanaYoshino/AnimeGANv2
- PyTorch model needs to be converted to ONNX

### DeepLab v3 (Semantic Segmentation)
- Available from ONNX Model Zoo: https://github.com/onnx/models

## Model Licensing

Each model has its own license. Please check the respective repositories for licensing information.

## Fallback Behavior

If models are not available, the application will gracefully fall back to non-AI processing methods.