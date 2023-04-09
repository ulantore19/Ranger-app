import cv2
import numpy as np
from sort import Sort
import sys
import os
from facenet_pytorch import MTCNN
import torch
import argparse
import time
from pathlib import Path
import torch.backends.cudnn as cudnn
from numpy import random
from models.experimental import attempt_load
from utils.datasets import LoadStreams, LoadImages
from utils.general import check_img_size, check_requirements, check_imshow, non_max_suppression, apply_classifier, \
    scale_coords, xyxy2xywh, strip_optimizer, set_logging, increment_path
from utils.plots import plot_one_box
from utils.torch_utils import select_device, load_classifier, time_synchronized, TracedModel

import requests
import json
from datetime import datetime

base_url = "http://185.146.3.164"

def upload_img_and_get_url(base_url, img_path):
    url = base_url + '/frames'
    filename = img_path.split('/')[-1]
    payload={}
    files=[
        ('frame',(filename, open(img_path,'rb'),'image/jpeg'))
    ]
    headers = {}

    response = requests.request("POST", url, headers=headers, data=payload, files=files)

    return response.json()['image_url']

def letterbox(img, new_shape=(640, 640), color=(114, 114, 114), auto=True, scaleFill=False, scaleup=True, stride=32):
    # Resize and pad image while meeting stride-multiple constraints
    shape = img.shape[:2]  # current shape [height, width]
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)

    # Scale ratio (new / old)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    if not scaleup:  # only scale down, do not scale up (for better test mAP)
        r = min(r, 1.0)

    # Compute padding
    ratio = r, r  # width, height ratios
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]  # wh padding
    if auto:  # minimum rectangle
        dw, dh = np.mod(dw, stride), np.mod(dh, stride)  # wh padding
    elif scaleFill:  # stretch
        dw, dh = 0.0, 0.0
        new_unpad = (new_shape[1], new_shape[0])
        ratio = new_shape[1] / shape[1], new_shape[0] / shape[0]  # width, height ratios

    dw /= 2  # divide padding into 2 sides
    dh /= 2

    if shape[::-1] != new_unpad:  # resize
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)  # add border
    return img, ratio, (dw, dh)



def get_iso_time():
    return datetime.now().isoformat()

def get_face_event_from(image_url, store_name="Smesharik Store"):
    return {
    "image_url": image_url,
    "device_name": store_name,
    "events": [
      {
        "title": "Face Detected", #"title": "Weapon Detected",
        "type": "info", #"warn"
      }
    ],
    "showPopup": False,
    "datetime": get_iso_time()
  }


def get_weapon_event_from(image_url, store_name="Smesharik Store"):
    return {
    "image_url": image_url,
    "device_name": store_name,
    "events": [
      {
        "title": "Weapon Detected",
        "type": "warn"
      }
    ],
    "showPopup": True,
    "datetime": get_iso_time()
  }


def send_event(base_url, image_url, is_weapon = False):
    url = base_url + '/api/device_event'
    event = get_face_event_from(image_url) if not is_weapon else get_weapon_event_from(image_url)
    payload = json.dumps(event)
    headers = {
      'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    print(response.text)


# image_url1 = upload_img_and_get_url(base_url, 'D:/tengrilab/WD/yolo/dataset/images/train/cctv_25.jpg')
# image_url2 = upload_img_and_get_url(base_url, 'photo_2023-04-09_01-52-59.jpg')
# send_event(base_url, image_url1, True)
# send_event(base_url, image_url2)

imgsz= 640
device = 0
webcam = 0
cap = cv2.VideoCapture('testnew1.mp4')

# Initialize the SORT tracker
tracker = Sort()
save_txt = 0
device = 'cuda' if torch.cuda.is_available() else 'cpu'

# Load face detector
mtcnn = MTCNN(margin=14, keep_all=True, factor=0.5, device=device)

model = attempt_load('best.pt', map_location=device)  # load FP32 model
stride = int(model.stride.max())  # model stride
imgsz = check_img_size(imgsz, s=stride)  # check img_size

model = TracedModel(model, device, 640)

cudnn.benchmark = True  # set True to speed up constant image size inference
# dataset = LoadStreams(0, img_size=imgsz, stride=stride)

names = model.module.names if hasattr(model, 'module') else model.names
colors = [[random.randint(0, 255) for _ in range(3)] for _ in names]

model(torch.zeros(1, 3, imgsz, imgsz).to(device).type_as(next(model.parameters())))  # run once
old_img_w = old_img_h = imgsz
old_img_b = 1

cudnn.benchmark = True

# Continuously process frames from the video capture device
while True:
    ret, frame = cap.read()
    if frame is not None:
        img = letterbox(frame, 640, stride=stride)[0]
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        img = img[:, :, ::-1].transpose(2, 0, 1)  # BGR to RGB, to 3x416x416
        img = np.ascontiguousarray(img)#loadfromimage

        img = torch.from_numpy(img).to(device)#maincycle
        img = img.float()  # uint8 to fp16/32
        img /= 255.0  # 0 - 255 to 0.0 - 1.0
        if img.ndimension() == 3:
            img = img.unsqueeze(0)
        # frame = cv2.cvtColor(im0s, cv2.COLOR_BGR2RGB)

        if (old_img_b != img.shape[0] or old_img_h != img.shape[2] or old_img_w != img.shape[3]):
            old_img_b = img.shape[0]
            old_img_h = img.shape[2]
            old_img_w = img.shape[3]
            for i in range(3):
                model(img, augment=0)[0]

            # Inference
            with torch.no_grad():   # Calculating gradients would cause a GPU memory leak
                pred = model(img, augment=0)[0]
            # Apply NMS
            pred = non_max_suppression(pred, 0.5, 0.65, classes=0, agnostic=0)

            # Process detections
            for i, det in enumerate(pred):  # detections per image
                gn = torch.tensor(frame.shape)[[1, 0, 1, 0]]  # normalization gain whwh
                if len(det):
                    cv2.imwrite('tmp.jpg', frame)
                    image_url1 = upload_img_and_get_url(base_url, 'tmp.jpg')
                    send_event(base_url, image_url1, True)

    try:
        boxes, _ = mtcnn.detect(frame)
        faces = boxes.astype(int)
    except:
        continue

    # Create a list of detections for the detected faces
    detections = []
    for (x, y, w, h) in faces:
        detections.append([x, y, x+w, y+h])  ##[x1,y1,x2,y2]
    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    # Update the tracker with the detections
    if len(detections) > 0:
        # 
        

        detections = np.array(detections)
        detections[:, 2] = detections[:, 2] - detections[:, 0]
        detections[:, 3] = detections[:, 3] - detections[:, 1]
        trackers = tracker.update(detections)
    else:
        trackers = tracker.update(np.empty((0, 5)))

    # Draw bounding boxes around the tracked faces
    for d in trackers:
        if d[4] == 0:
            continue
        
        bbox = d[:4].astype(np.int32)
        faceimage = frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        if faceimage is not None:
            cv2.imwrite('tmpface.jpg', faceimage)
            image_url2 = upload_img_and_get_url(base_url, 'tmpface.jpg')
            send_event(base_url, image_url2)
        # cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
    #     cv2.putText(frame, f"id: {d[4]}", (bbox[0], bbox[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255,0 , 0), 2)
    # # Display the frame with face tracking information
    
    # cv2.imshow('Face Tracking', frame)
    
    # Exit the loop if the 'q' key is pressed
    # if cv2.waitKey(1) & 0xFF == ord('q'):
    #     break

# Release the video capture device and close all windows
cap.release()
cv2.destroyAllWindows()