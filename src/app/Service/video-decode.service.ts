import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FileData } from '@ffmpeg/ffmpeg/dist/esm/types';

@Injectable({
  providedIn: 'root'
})
export class VideoDecodeService  {
  private ffmpeg = new FFmpeg();
  private frameSize: number;
  loaded = false;
  private baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

  constructor() {
    this.frameSize = 640 * 380 * 4; // RGBA frame size (modify as needed)
    this.initializeFFmpeg();
  }

  private async initializeFFmpeg() {
    this.ffmpeg.on("log", ({ message }) => console.log(message));
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${this.baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
      classWorkerURL: 'http://localhost:4200/assets/ffmpeg/worker.js'
    });
    this.loaded = true;
    console.log("FFmpeg loaded:", this.loaded);
  }

  async decodeVideo(videoURL: string, width: number, height: number, frameRate: number): Promise<Uint8Array[]> {
    if (!this.loaded) {
      console.error("FFmpeg is not loaded yet.");
      return [];
    }

    try {
      await this.ffmpeg.load();
      await this.ffmpeg.writeFile("input.mp4", await fetchFile(videoURL));

      // FFmpeg command to extract raw RGBA video frames
      await this.ffmpeg.exec([
        '-ss', '00:00:00',
        '-i', 'input.mp4',
        '-t', '00:00:20',
        '-s', `${width}x${height}`,
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        'output.rgba',
        '-nostdin', '-y',
      ]);

      console.log("Raw RGBA data extraction completed.");
      const fileData: FileData = await this.ffmpeg.readFile('output.rgba');
      return this.prepareFrames(fileData as Uint8Array, width, height);
    } catch (error) {
      console.error("Error decoding video:", error);
      return [];
    }
  }

  private prepareFrames(frameData: Uint8Array, width: number, height: number): Uint8Array[] {
    const frameSize = width * height * 4;
    const frameCount = Math.floor(frameData.length / frameSize);
    console.log(`Total Frames: ${frameCount}`);

    const frameDataArray: Uint8Array[] = [];
    for (let i = 0; i < frameCount; i++) {
      const frameStart = i * frameSize;
      const frameEnd = frameStart + frameSize;
      frameDataArray.push(frameData.slice(frameStart, frameEnd));
    }

    return frameDataArray;
  }
  
}