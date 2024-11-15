import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Time } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TimeLineComponent } from "./time-line/time-line.component";
import { VideoDecodeService } from './Service/video-decode.service';
import { DateUtil } from './time-line/date-util';
import Hls from 'hls.js';
const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, TimeLineComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private videoCanvas: HTMLCanvasElement | undefined;
  private ctx!: CanvasRenderingContext2D;
  width = 640;
  height = 380;
  frameRate = 30;
  frameDataArray: Uint8Array[] = [];
  playing = false;
  currentFrame = 0;
  selectedSpeed = 1;
  currentTimeMs!: any
  intervalId: ReturnType<typeof setInterval> | null = null;
  selectedTime: number = 24;
  playbackfile : string = '';
  @ViewChild(TimeLineComponent) timeLineComponent!: TimeLineComponent;
  videoURL = "http://localhost:4200/assets/h265-640x480-30FPS-50GOP-512Kbps-aac-16Khz-32Kbps.mp4";
  isUserInteractingWithTimeline = false;

  constructor(private videoDecoderService: VideoDecodeService) { } // Inject the service

  ngOnInit() {
    // this.setupCanvas();

    // const videoElement = document.getElementById('my-video') as HTMLVideoElement;

    // if (videoElement) {
    //   videoElement.addEventListener('timeupdate', () => {
    //     this.currentTimeMs = Number(videoElement.currentTime);
    //     console.log("currentTimeMs : " + DateUtil.formatDate(
    //            new Date(this.currentTimeMs),
    //            'YYYY-MM-DD HH:mm:ss'
    //           ));

    //   });
    // }
  }
  onFilenameChange(filename: string) {
    this.playbackfile = filename;
    console.log('Received filename:', filename);
    // You can call any method here to load or handle the video
    this.loadVideo(filename);
  }

  loadVideo(m3u8Url: string) {
    const video = document.getElementById('my-video') as HTMLVideoElement;
  
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(`http://localhost:8000/${m3u8Url}`);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
        console.log('Video started at currentTime:', video.currentTime); // Check initial time
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = `http://localhost:8000/${m3u8Url}`;
      video.play();
      console.log('Video started without HLS:', video.currentTime); // Fallback check
    } else {
      alert('Your browser does not support HLS playback.');
    }

    if (video) {
      video.addEventListener('timeupdate', () => {
        this.currentTimeMs = Number(video.currentTime);
        console.log("currentTimeMs : " + DateUtil.formatDate(
               new Date(this.currentTimeMs),
               'YYYY-MM-DD HH:mm:ss'
              ));

      });
    }

  }
  

  convertToTime(ms: number): Date {
    const totalSeconds = Math.floor(ms / 1000);  // Convert milliseconds to seconds
    const hours = Math.floor(totalSeconds / 3600);  // Get the hours
    const minutes = Math.floor((totalSeconds % 3600) / 60);  // Get remaining minutes
    const seconds = totalSeconds % 60;  // Get remaining seconds
    const currentDate = new Date();
    // Add leading zeros if necessary
    const hoursStr = hours < 10 ? 0 + hours : hours;
    const minutesStr = minutes < 10 ? 0 + minutes : minutes;
    const secondsStr = seconds < 10 ? 0 + seconds : seconds;
    currentDate.setHours(hoursStr, minutesStr, secondsStr, 0);
    return currentDate;
  }


  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`; // MM:SS format
  }

  onTimelineChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.currentFrame = +target.value; // Get the frame from the slider

    // Render the selected frame immediately when the timeline changes
    const imageData = new ImageData(
      new Uint8ClampedArray(this.frameDataArray[this.currentFrame]),
      this.width,
      this.height
    );
    this.ctx.putImageData(imageData, 0, 0);
  }

  handleChangedTime(time: number) {
    this.selectedTime = time;
  }

  onValueChange(event: any) {
    this.selectedTime = event.target.value;
    this.timeLineComponent.onDurationChange(this.selectedTime);
  }

  onTimeChange(newTime: number)
  {
    // console.log("onTimeChange : " + newTime)
    const videoElement = document.getElementById('my-video') as HTMLVideoElement;
    if (videoElement) {
      // console.log("newTime : " + newTime);
      videoElement.currentTime = newTime / 1000;
      this.isUserInteractingWithTimeline = false;
      this.timeLineComponent.isUserInteracting = false;
    }
  }
}

