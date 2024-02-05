FROM python:3.11.3

# Uncomment the following lines to make PyTorch available to your application.
# See https://skiff.allenai.org/gpu.html for more details.
#
# ENV LD_LIBRARY_PATH /usr/local/nvidia/lib:/usr/local/nvidia/lib64
# ENV NVIDIA_VISIBLE_DEVICES all
# ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
RUN pip install torch==2.0.1 -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install torchvision==0.15.2 -f https://download.pytorch.org/whl/torch_stable.html
# RUN pip install transformers -f https://download.pytorch.org/whl/torch_stable.html


RUN apt-get update && apt-get install -y tesseract-ocr

RUN apt-get update && \
    apt-get install -y openjdk-11-jdk ca-certificates-java && \
    apt-get clean && \
    update-ca-certificates -f
ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk-amd64/
RUN export JAVA_HOME

WORKDIR /api

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy over the source code
COPY . .

ENV GROBID_SERVICE "http://localhost:8070"

# Kick things off
ENTRYPOINT [ "/api/start.sh" ]