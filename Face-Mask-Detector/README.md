 😷 Face Mask Detection System (Deep Learning \& Computer Vision)



A \*\*real-time face mask detection system\*\* built using \*\*Deep Learning (MobileNetV2)\*\* and \*\*OpenCV\*\*, capable of detecting human faces from a live webcam feed and classifying whether each person is wearing a face mask or not.



This project demonstrates \*\*transfer learning\*\*, \*\*computer vision\*\*, and \*\*real-time inference\*\* using Python.



---


 📌 Features



\* ✅ Real-time face detection using OpenCV DNN

\* ✅ Face mask classification using a deep learning model

\* ✅ MobileNetV2-based transfer learning

\* ✅ Live webcam inference with bounding boxes

\* ✅ High accuracy with minimal latency

\* ✅ Training visualization (loss \& accuracy plots)



---



\## 🧠 Project Architecture



```

Webcam / Video Stream

&nbsp;       ↓

Face Detection (OpenCV DNN - SSD)

&nbsp;       ↓

Face Cropping \& Preprocessing

&nbsp;       ↓

Mask Classification (MobileNetV2)

&nbsp;       ↓

Live Bounding Box + Label (Mask / No Mask)

```



---



\## 📂 Project Structure



```

Face-Mask-Detection/

│

├── dataset/

│   ├── with\_mask/

│   └── without\_mask/

│

├── face\_detector/

│   ├── deploy.prototxt

│   └── res10\_300x300\_ssd\_iter\_140000.caffemodel

│

├── train\_mask\_detector.py

├── detect\_mask\_video.py

├── mask\_detector.model

├── plot.png

├── requirements.txt

└── README.md

```



---



\## 🏗️ Model Details



\### 🔹 Base Model



\* \*\*MobileNetV2\*\* (pretrained on ImageNet)



\### 🔹 Custom Classification Head



\* Average Pooling

\* Fully Connected Layer (128 neurons, ReLU)

\* Dropout (0.5)

\* Output Layer (2 classes: Mask / No Mask)



\### 🔹 Training Configuration



\* Optimizer: Adam

\* Learning Rate: `1e-4`

\* Epochs: `20`

\* Batch Size: `32`

\* Loss Function: Binary Crossentropy

\* Data Augmentation: Rotation, zoom, shift, flip



---



\## 📈 Training Results



\* High training and validation accuracy (~90–97%)

\* Low and stable loss

\* No significant overfitting observed



Training progress visualization is saved as:



```

plot.png

```



---



\## 🚀 Installation \& Setup



\### 1️⃣ Clone the Repository



```bash

git clone https://github.com/your-username/Face-Mask-Detection.git

cd Face-Mask-Detection

```



\### 2️⃣ Create a Virtual Environment (Recommended)



```bash

python -m venv venv

source venv/bin/activate   # Linux / Mac

venv\\Scripts\\activate      # Windows

```



\### 3️⃣ Install Dependencies



```bash

pip install -r requirements.txt

```



---



\## 🏃‍♂️ How to Run



\### 🔹 Train the Model (Optional)



```bash

python train\_mask\_detector.py

```



This will:



\* Train the neural network

\* Save the model as `mask\_detector.model`

\* Generate `plot.png`



---



\### 🔹 Run Real-Time Mask Detection



```bash

python detect\_mask\_video.py

```



\* Opens webcam

\* Detects faces

\* Displays \*\*Mask / No Mask\*\* labels

\* Press \*\*`q`\*\* to exit



---



\## 🛠️ Technologies Used



\* Python

\* TensorFlow / Keras

\* OpenCV

\* MobileNetV2

\* NumPy

\* Matplotlib

\* Imutils

\* Scikit-learn



---



\## 🎯 Use Cases



\* Public safety monitoring

\* Smart surveillance systems

\* Entry control systems

\* AI-powered compliance checking

\* Computer vision learning projects



---



\## ⚠️ Limitations



\* Performance depends on lighting conditions

\* Mask types not seen during training may reduce accuracy

\* Not optimized for large crowds



---



\## 🔮 Future Improvements



\* Add support for video files

\* Deploy as a web application (Flask / FastAPI)

\* Improve dataset diversity

\* Optimize for edge devices (Jetson / Raspberry Pi)

\* Add multi-class detection (improper mask usage)



---



\## 👤 Author



\*\*Suhas Panuganti\*\*

Master’s in Computer Science

Aspiring Full Stack Developer \& AI/ML Enthusiast



📌 \*This project was built for learning and demonstration purposes.\*



---



\## ⭐ Acknowledgements



\* MobileNetV2 – Google Research

\* OpenCV DNN Face Detector

\* TensorFlow \& Keras community



---



