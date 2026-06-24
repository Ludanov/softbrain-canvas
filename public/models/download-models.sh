#!/bin/bash

# Vector Magic AI Models Download Script
# Downloads ONNX models for AI-powered image processing

set -e

MODELS_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$MODELS_DIR"

echo "==================================================="
echo "  Vector Magic AI Models Downloader"
echo "==================================================="
echo ""
echo "This script will download ONNX models for:"
echo "  - Edge Detection (PiDiNet)"
echo "  - Background Removal (U²-Net)"
echo "  - Style Harmonization (AnimeGAN v2)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to download a model
download_model() {
    local name=$1
    local url=$2
    local filename=$3
    local size=$4

    if [ -f "$filename" ]; then
        echo -e "${GREEN}✓${NC} $name already exists ($filename)"
        return 0
    fi

    echo -e "${BLUE}↓${NC} Downloading $name ($size)..."
    
    if curl -L --progress-bar -o "$filename.tmp" "$url"; then
        mv "$filename.tmp" "$filename"
        echo -e "${GREEN}✓${NC} Downloaded $name successfully"
    else
        echo -e "${RED}✗${NC} Failed to download $name"
        rm -f "$filename.tmp"
        return 1
    fi
}

echo "Starting downloads..."
echo ""

# U²-Net Portrait Mode (smaller, faster version for background removal)
# Using a publicly available ONNX conversion
download_model \
    "U²-Net Portrait Mode" \
    "https://github.com/nickyoutter/nickyoutter.github.io/raw/main/models/u2netp.onnx" \
    "u2netp.onnx" \
    "~4 MB"

# Alternative: Download from a more reliable source if the above fails
if [ ! -f "u2netp.onnx" ]; then
    echo -e "${YELLOW}!${NC} Trying alternative source for U²-Net..."
    download_model \
        "U²-Net Portrait Mode (alt)" \
        "https://huggingface.co/nickyoutter/u2net-onnx/resolve/main/u2netp.onnx" \
        "u2netp.onnx" \
        "~4 MB"
fi

# PiDiNet for edge detection (simplified edge detection model)
# Note: PiDiNet ONNX models are not widely available, we'll use a fallback edge detection
if [ ! -f "pidinet.onnx" ]; then
    echo -e "${YELLOW}!${NC} PiDiNet ONNX not publicly available"
    echo -e "${BLUE}ℹ${NC} Creating placeholder - edge detection will use fallback algorithm"
    echo '{"note": "PiDiNet model not available - using fallback edge detection"}' > pidinet.onnx.placeholder
fi

# AnimeGAN v2 for style harmonization
# Note: AnimeGAN ONNX models need to be converted from PyTorch
if [ ! -f "animegan_v2.onnx" ]; then
    echo -e "${YELLOW}!${NC} AnimeGAN v2 ONNX not publicly available"
    echo -e "${BLUE}ℹ${NC} Creating placeholder - style harmonization will use fallback"
    echo '{"note": "AnimeGAN v2 model not available - using fallback style processing"}' > animegan_v2.onnx.placeholder
fi

echo ""
echo "==================================================="
echo "  Download Summary"
echo "==================================================="

# Check what we have
if [ -f "u2netp.onnx" ]; then
    echo -e "${GREEN}✓${NC} Background Removal (U²-Net): Available"
else
    echo -e "${YELLOW}!${NC} Background Removal (U²-Net): Not available - using fallback"
fi

if [ -f "pidinet.onnx" ]; then
    echo -e "${GREEN}✓${NC} Edge Detection (PiDiNet): Available"
else
    echo -e "${YELLOW}!${NC} Edge Detection (PiDiNet): Not available - using fallback"
fi

if [ -f "animegan_v2.onnx" ]; then
    echo -e "${GREEN}✓${NC} Style Harmonizer (AnimeGAN): Available"
else
    echo -e "${YELLOW}!${NC} Style Harmonizer (AnimeGAN): Not available - using fallback"
fi

echo ""
echo -e "${BLUE}ℹ${NC} Note: The app will gracefully fall back to non-AI processing"
echo "    for any missing models."
echo ""
echo "Done!"