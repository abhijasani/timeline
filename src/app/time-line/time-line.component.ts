import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CanvasPos, PlaybackEntryType, VideoCellType } from './timeline.interface';
import { interval, map, Subscription } from 'rxjs';
import { DateUtil } from './date-util';
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Observable } from 'rxjs';

@Component({
  selector: 'time-line',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './time-line.component.html',
  styleUrl: './time-line.component.css'
})

export class TimeLineComponent implements OnInit, OnChanges {
  // @Input() receivedValue: number = 24;
  canvasHeight = 80;
  scale = this.canvasHeight / 4.55;
  @Input() playTime: number;
  speed: number;
  forWardValue: number;
  startTimeThreshold: number | string | Date;
  endTimeThreshold: number | string | Date;
  totalTimelineDuration!: number;
  borderColor: string;
  bgColor: string;
  bottomLineColor: string;
  verticalBarColor: string;
  playBarColor: string;
  isPlayClick: boolean;
  isUserInteracting = false;

  @Output() timeChange = new EventEmitter<number>();
  @Output() zoomLevel = new EventEmitter<any>();
  @Output() SendFileForPlayback = new EventEmitter<string>();
  // @Output() filenameChange = new EventEmitter<string>();

  // emit data when click playButton
  @Output() readonly playClick: EventEmitter<any>;

  // emit data when mouseUp
  @Output() readonly mouseUp: EventEmitter<any>;

  // emit data when mouseDown
  @Output() readonly mouseDown: EventEmitter<any>;

  // emit data when keyUp
  @Output() readonly keyUp: EventEmitter<any>;

  // emit data when keyDown
  @Output() readonly keyDown: EventEmitter<any>;

  // --- canvas data start ---//

  // canvas box
  canvas: any;

  // canvas context
  ctx: any;

  // canvas width
  canvasW!: number;

  // canvas height
  canvasH!: number;

  // video clips in reality
  timecell!: Array<VideoCellType>;

  // per minute stand for step
  minutesPerStep!: Array<number>;

  // per minite stand for px
  pxPerMs!: number;

  // Minimum width between scales, unit px
  graduationStep!: number;

  // The timeline shows x hours
  hoursPerRuler!: number;

  // The leftmost timestamp that appears -- the default is the first 12 hours
  startTimestamp!: number;

  // current timestamp
  currentTimestamp!: number;

  // Px two hours apart
  distanceBetweenGtitle: number = 0;

  // zoom of canvas
  zoom!: number;

  // marker of drag an unreleased mouse event
  gIsMousedown!: boolean;

  // marker of drag the mouse move
  gIsMousemove!: boolean;

  // The position of the X-axis when the mouse is pressed
  gMousedownCursor!: number;

  // The position of the y-axis when the mouse is pressed
  gMousedownCursorY!: number;

  // Time flow timer
  setTimeMove!: Subscription;

  // The distance to the left of the play button
  playBarDistanceLeft!: number;

  // Play the initial position of the icon
  playBarOffsetX!: number;

  // Play the X-axis position 1 of the icon
  playBarOffsetX1!: number;

  // Play the X-axis position 2 of the icon
  playBarOffsetX2!: number;

  // Play the Y-axis position 1 of the icon
  playBarOffsetY1!: number;

  // Play the Y-axis position 2 of the icon
  playBarOffsetY2!: number;
  today = new Date();

  // --- canvas data end ---//
  videoCells: Array<VideoCellType>;

  MytimelineEntries: Array<PlaybackEntryType>;
  // elements of the timeline
  @ViewChild('timeline', { static: true }) canvasExp!: ElementRef;



  constructor(private http: HttpClient) {
    this.forWardValue = 5000;
    this.speed = 1000;
    this.playTime = new Date().getTime();

    console.log("from playtime :: "+ DateUtil.formatDate(
      new Date(this.playTime),
      'YYYY-MM-DD HH:mm:ss'
    ));

    this.startTimeThreshold = new Date(this.today.setHours(0, 0, 0, 0));;
    this.endTimeThreshold = new Date(this.today.setHours(23, 59, 59, 999));
    this.totalTimelineDuration = Number(this.endTimeThreshold) - Number(this.startTimeThreshold); // Calculate the duration
    this.playClick = new EventEmitter<any>();
    this.mouseUp = new EventEmitter<any>();
    this.mouseDown = new EventEmitter<any>();
    this.keyUp = new EventEmitter<any>();
    this.keyDown = new EventEmitter<any>();

    this.MytimelineEntries = [];
    this.videoCells = [];
    // this.videoCells = [
    //   {
    //     beginTime: new Date(this.today.setHours(10, 0, 0, 0)),  // 3 hours ago
    //     endTime: new Date(this.today.setHours(10, 30, 0, 0)),    // 1 hour ago
    //     style: {
    //       background: 'rgba(255, 0, 0, 0.498039)'
    //     }
    //   },
    //   {
    //     beginTime: new Date(this.today.setHours(11, 0, 0, 0)),  // 3 hours ago
    //     endTime: new Date(this.today.setHours(11, 30, 0, 0)), 
    //     style: {
    //       background: 'rgba(255, 0, 0, 0.498039)'
    //     }
    //   }
    // ];


    this.isPlayClick = false;
    this.verticalBarColor = 'rgba(0,0,0,1)';
    this.bottomLineColor = 'rgba(0,0,0,1)';
    this.borderColor = '#448aff';
    this.bgColor = '#448aff';
    this.playBarColor = 'rgba(0,0,0,1)';
  }

  /**
   * Browser change event
   */
  @HostListener('window:resize', [])
  onResize(): void {
    this.canvas.width = Math.round(this.canvas.parentNode.offsetWidth - 2);
    this.canvasW = this.canvas.parentNode.offsetWidth;
    this.init(this.startTimestamp, this.timecell, false);
  }

  /**
   * Keyboard press event
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: any): void {
    if (Number(event.keyCode) === 37) {
      this.playTime = Number(this.playTime) - this.forWardValue;
      this.currentTimestamp = Number(this.currentTimestamp) - this.forWardValue;
      this.set_time_to_middle(this.playTime);

    } else if (Number(event.keyCode === 39)) {
      this.playTime = Number(this.playTime) + this.forWardValue;
      this.currentTimestamp = Number(this.currentTimestamp) + this.forWardValue;
      this.set_time_to_middle(this.playTime);
    }
    else if (Number(event.keyCode === 80)) {
      console.log("play clicked")
      if (this.isPlayClick) {
        this.onPauseClick()
      } else {
        this.onPlayClick();
      }
    }
    this.keyDown.emit(this.playTime);
  }

  /**
   * Keyboard release event
   */
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: any): void {
    if (Number(event.keyCode) === 13 || Number(event.keyCode === 32)) {
      this.isPlayClick ? this.onPauseClick() : this.onPlayClick();
    }
    this.keyUp.emit(this.playTime);
  }

  async ngOnInit(): Promise<void> {
    // Initialize data video group event stamp to show new Date().getTime()- number of hours
    // Assign the Canvas DOM to the variable Canvas
    this.canvas = this.canvasExp.nativeElement;


    // Define the area of the canvas
    this.ctx = this.canvas.getContext('2d');

    // Redefine the width of the canvas. The default canvas is 300. Assign the width of the parent element
    this.canvas.width = Math.round(this.canvas.parentNode.offsetWidth - 2);
    // Store the width and height of the canvas
    this.canvasW = this.canvas.width;
    this.canvas.height = this.canvasHeight;
    this.canvasH = this.canvas.height;

    this.timecell = this.videoCells;

    // Initialize the number of steps per minute
    this.minutesPerStep = [
      1,
      2,
      5,
      10,
      15,
      20,
      30,
      60,
      120,
      180,
      240,
      360,
      720,
      1440
    ];

    // Initialization style

    // Minimum width between scales, in units of px 20px
    this.graduationStep = 20;

    // The timeline shows the time rounded up according to the time threshold
    this.hoursPerRuler = Math.ceil((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600) < 24 ?
      Math.ceil((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600) :
      24;

    // The leftmost timestamp defaults to 12 hours before the current time
    this.startTimestamp = Number(this.startTimeThreshold);

    // Default distance 80
    this.distanceBetweenGtitle = 80;
    // Default zoom 24
    this.zoom = 24;

    // Default false
    this.gIsMousedown = false;
    this.gIsMousemove = false;
    this.gMousedownCursor = 0;

    // px/ms
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);

    // The initial X position of the playback icon is in the middle of the scale
    this.playBarOffsetX = this.canvasW / 2;

    this.playBarDistanceLeft = this.playBarOffsetX / this.pxPerMs / 3600 / 1000 / this.hoursPerRuler;
    this.currentTimestamp = this.startTimestamp + this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000;

    this.playBarOffsetX1 = this.playBarOffsetX - (this.scale * 0.6);
    this.playBarOffsetX2 = this.playBarOffsetX + (this.scale * 0.6);
    this.playBarOffsetY1 = (this.scale * 2.5);
    this.playBarOffsetY2 = ((this.scale * 3.5));

    // Initialize the timeline

    // Draw the play button
    // this.loadTimelineEntriesAndConvert();

   
    await this.loadTimelineEntries();
    await this.convertToVideoCells();
    await this.init(this.startTimestamp, this.timecell, false);
    await this.drawPalyBar();
  }

  /**
   * Initialize
   * @param  startTimestamp Leftmost time
   * @param  redrawFlag Whether to redraw the mark
   */
  init(startTimestamp: number, timecell: any, redrawFlag: boolean): void {
    this.timecell = timecell;
    this.startTimestamp = startTimestamp;
    // if (
    //   this.currentTimestamp >=
    //   Number(this.endTimeThreshold)
    // ) {
    //   this.startTimestamp =
    //     Number(this.endTimeThreshold) -
    //     (this.hoursPerRuler * this.playBarDistanceLeft * 1000 * 3600);
    //   this.currentTimestamp =
    //     Number(this.startTimestamp) + (this.hoursPerRuler * this.playBarDistanceLeft * 1000 * 3600);
    //   this.playTime =
    //     Number(this.startTimestamp) + (this.hoursPerRuler * this.playBarDistanceLeft * 1000 * 3600);
    //     console.log("init : " + DateUtil.formatDate(
    //       new Date(this.startTimestamp),
    //       'YYYY-MM-DD HH:mm:ss'
    //     ));

    // } else if (
    //   this.currentTimestamp <=
    //   Number(this.startTimeThreshold)
    // ) {
    //   this.startTimestamp =
    //     Number(this.startTimeThreshold) -
    //     (this.hoursPerRuler * this.playBarDistanceLeft * 1000 * 3600);
    //   this.currentTimestamp =
    //     Number(this.startTimestamp) + (this.hoursPerRuler * this.playBarDistanceLeft * 1000 * 3600);
    //   this.playTime =
    //     Number(this.startTimestamp) + (this.hoursPerRuler * this.playBarDistanceLeft * 1000 * 3600);
    // }
    this.drawCellBg();
    this.add_graduations(startTimestamp);
    // Draw the verticalBar
    this.add_cells(timecell);
    this.drawLine(
      0,
      this.canvasH,
      this.canvasW,
      this.canvasH,
      this.bottomLineColor,
      1
    );
  }

  /**
  * Draws the background of the video block
  */
  drawCellBg(): void {
    this.ctx.fillStyle = 'rgba(69, 72, 76, 0.5)';
    this.ctx.fillRect(0, 0, this.canvasW, 0);
  }

  // Fetch the master playlist and extract filenames
  fetchMasterPlaylist(): Observable<string[]> {
    const masterUrl = 'http://localhost:8000/master.m3u'; // Adjust URL as needed

    return this.http.get(masterUrl, { responseType: 'text' }).pipe(
      map((masterPlaylist: string) => {
        // Split the playlist by newlines and filter out the lines that include '.m3u8'
        return masterPlaylist.split('\n').filter(line => line.includes('.m3u8')).map(line => line.trim());
      })
    );
  }

  // Generate timeline entries based on filenames
  async generateTimelineEntries(filenames: string[]): Promise<any[]> {
    const entries = [];
    for (const filename of filenames) {
      const startTime = this.parseFilenameToTime(filename);
      const duration = await this.fetchSegmentDuration(`http://localhost:8000/${filename}`).toPromise();

      if (duration && !isNaN(duration)) {
        const endTime = new Date(startTime.getTime() + duration);
        entries.push({ filename, startTime, endTime });
      } else {
        console.error(`Invalid duration for file ${filename}`);
      }
    }
    return entries;
  }

  parseFilenameToTime(filename: string): Date {
    const baseFilename = filename.replace('.m3u8', '');
    const [hour, minute, second, day, month, year] = baseFilename.split('_');
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  }

  // Fetch segment duration from an .m3u8 playlist URL
  fetchSegmentDuration(m3u8Url: string): Observable<number> {
    return new Observable(observer => {
      this.http.get(m3u8Url, { responseType: 'text' }).subscribe({
        next: playlistText => {
          // Find all duration lines (#EXTINF:duration)
          const durationLines = playlistText.match(/#EXTINF:([0-9.]+)/g);
          if (!durationLines) {
            observer.next(0);
            observer.complete();
            return;
          }

          // Sum durations to calculate total segment time in seconds
          const totalDuration = durationLines.reduce((sum, line) => {
            const duration = parseFloat(line.split(':')[1]);
            return sum + duration;
          }, 0);

          // Convert to milliseconds
          observer.next(totalDuration * 1000);
          observer.complete();
        },
        error: error => {
          console.error(`Error fetching duration for ${m3u8Url}:`, error);
          observer.next(0);
          observer.complete();
        }
      });
    });
  }

// Call the methods to generate timeline entries
loadTimelineEntries(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.fetchMasterPlaylist().subscribe({
      next: (filenames: string[]) => {
        // After fetching the playlist, generate the timeline entries
        this.generateTimelineEntries(filenames).then(entries => {
          this.MytimelineEntries = entries;
          console.log('Timeline Entries in loadTimeline:', this.MytimelineEntries);
          resolve(); // Resolve when everything is completed
        }).catch(error => {
          console.error('Error generating timeline entries:', error);
          reject(error); // Reject if there is an error
        });
      },
      error: (error) => {
        console.error('Error fetching master playlist:', error);
        reject(error); // Reject if there is an error fetching the playlist
      }
    });
  });
}


  convertToVideoCells(): void {
    this.videoCells.push(...this.MytimelineEntries.map(entry => ({
      beginTime: entry.startTime,
      endTime: entry.endTime,
      style: { background: 'red' }
    })));
  }

  async loadTimelineEntriesAndConvert() {
    await this.loadTimelineEntries(); // Wait for the first operation to complete
    await this.convertToVideoCells();  // Then call the second operation after the first is done
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['playTime'] && !this.isUserInteracting) {
      const currentTime = (changes['playTime'].currentValue) * 1000;
      if (!isNaN(currentTime)) {
        // console.log("currentTime : " + DateUtil.formatDate(
        //   new Date(),
        //   'YYYY-MM-DD HH:mm:ss'
        // ) + " Ms : " + currentTime);
        console.log("set time middle from ngonchanges ");
        this.timecell = this.videoCells;
        this.set_time_to_middle(currentTime);
      }
      if (changes['videoCells']) {
        this.videoCells = changes['videoCells'].currentValue;

        this.timecell = this.videoCells;
        this.add_cells(this.timecell);

        // this.init(this.startTimestamp, this.timecell, true);
        // this.drawPalyBar();
      }
    }

  }

  /**
 * Add video segment
 * @param  cells Video array
 */
  add_cells(cells: any): void {
    cells.forEach((cell: MouseEvent) => {
      this.draw_cell(cell);
    });
  }

  /**
   * Draw video blocks
   * @param  cell The cell includes beginTime Ms; The endTime ms; style;
   */
  draw_cell(cell: any): void {
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 60 * 60 * 1000); // px/ms
    const beginX = (cell.beginTime - this.startTimestamp) * pxPerMs;
    const cellWidth = (cell.endTime - cell.beginTime) * pxPerMs;
    this.ctx.fillStyle = cell.style.background;
    this.ctx.fillRect(beginX, 0, cellWidth, (this.scale * 0.75));
  }

  /**
   * Draw add scale
   * @param  startTimestamp Leftmost time
   */
  add_graduations(startTimestamp: number): void {
    // px/min
    const pxPerMin = this.canvasW / (this.hoursPerRuler * 60);
    // px/ms
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 60 * 60 * 1000);
    // The default minimum value of PX/steo is 20px
    let pxPerStep = this.graduationStep;

    // Min/steo
    let minPerStep = pxPerStep / pxPerMin;

    for (const v of this.minutesPerStep) {
      if (minPerStep <= v) {
        // Keep each cell within the range specified by minutesPerStep
        minPerStep = v;
        pxPerStep = pxPerMin * minPerStep;
        break;
      }
    }
    let mediumStep = 30;
    for (const v of this.minutesPerStep) {
      if (this.distanceBetweenGtitle / pxPerMin <= v) {
        mediumStep = v;
        break;
      }
    }
    // The total number
    const numSteps = this.canvasW / pxPerStep;
    // console.log("numSteps : " + numSteps);
    let graduationLeft: number;
    let graduationTime: number;

    let caretClass: string;
    let lineH: number;

    // The initial offset time (ms)
    const msOffset = this.ms_to_next_step(
      startTimestamp,
      minPerStep * 60 * 1000
    );

    // The initial offset is (px)
    const pxOffset = msOffset * pxPerMs;


    const msPerStep = Math.round(Number(pxPerStep / pxPerMs));
    for (let i = 0; i < numSteps; i++) {
      // Distance = offset distance to start + steps *px/ steps
      graduationLeft = pxOffset + i * pxPerStep;

      // Time = left start time + offset time + steps *ms/ steps
      graduationTime =
        Number(startTimestamp) +
        Number(msOffset) +
        i * Number(msPerStep);

      // console.log("graduationTime : " + graduationTime);

      const date = new Date(graduationTime);
      // console.log("getUTCHours : " + date.getUTCHours() + " getUTCMinutes " + date.getUTCMinutes());
      if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
        caretClass = 'big';
        lineH = (this.scale * 1.25);
        const bigDate = DateUtil.formatDate(date, 'HH:mm:ss');
        // console.log("bigDate : " + bigDate);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(bigDate, graduationLeft, (this.scale * 1.5));
        this.ctx.fillStyle = this.verticalBarColor;
      } else if ((graduationTime / (60 * 1000)) % mediumStep === 0) {
        caretClass = 'middle';
        lineH = (this.scale * 0.75);
        const middleDate = DateUtil.formatDate(date, 'HH:mm:ss');
        // console.log("middleDate : " + middleDate);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(middleDate, graduationLeft, (this.scale * 1.5));
        this.ctx.fillStyle = this.verticalBarColor;
      } else {
        lineH = (this.scale * 0.5);
      }
      // drawLine(graduationLeft,0,graduationLeft,lineH,"rgba(151,158,167,0.4)",1);
      this.drawLine(
        graduationLeft,
        0,
        graduationLeft,
        lineH,
        this.verticalBarColor,
        1
      );
    }
  }

  /**
   * Draw the play button
   */
  drawPalyBar(): void {
    this.ctx.beginPath();
    this.ctx.moveTo(this.playBarOffsetX, 0);
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.strokeStyle = this.playBarColor;
    this.ctx.stroke();
    this.ctx.moveTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.lineTo(this.playBarOffsetX - (this.scale * 0.6), (this.scale * 2.5));
    this.ctx.lineTo(this.playBarOffsetX - (this.scale * 0.6), (this.scale * 3.5));
    this.ctx.lineTo(this.playBarOffsetX + (this.scale * 0.6), (this.scale * 3.5));
    this.ctx.lineTo(this.playBarOffsetX + (this.scale * 0.6), (this.scale * 2.5));
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.fillStyle = this.playBarColor;
    this.ctx.fill();
    this.ctx.closePath();
    // this.init(this.startTimestamp, this.timecell, false);
    const time = Number(this.currentTimestamp);
    this.ctx.fillStyle = this.playBarColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      DateUtil.formatDate(new Date(time), 'YYYY-MM-DD HH:mm:ss'),
      this.playBarOffsetX,
      (this.scale * 4.25)
    );
  }

  /**
   * Draw the line
   * @param  beginX The X-axis to start with
   * @param  beginY The Y-axis to start with
   * @param  endX The end of the X-axis
   * @param  endY The end of the Y-axis
   * @param  color color
   * @param  width width
   */
  drawLine(
    beginX: number,
    beginY: number,
    endX: number,
    endY: number,
    color: string,
    width: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(beginX, beginY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.stroke();

  }

  /**
   * Drag/click the Mousedown event
   */
  mousedownFunc(e: MouseEvent): void {
    this.gIsMousedown = true;
    this.gMousedownCursor = this.get_cursor_x_position(e).posX;
    this.gMousedownCursorY = this.get_cursor_x_position(e).posY;
    this.isUserInteracting = true;
    // console.log("mousedownFunc : " + DateUtil.formatDate(
    //   new Date(this.currentTimestamp),
    //   'YYYY-MM-DD HH:mm:ss'
    // ));
  }

  /**
   * Drag/mouse hover to display mousemove events
   */
  mousemoveFunc(e: MouseEvent): void {
    this.clearCanvas();
    const posX = this.get_cursor_x_position(e).posX;
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);
    const diffX = posX - this.gMousedownCursor;
    if (this.gIsMousedown) {
      this.startTimestamp =
        this.startTimestamp - Math.round(diffX / pxPerMs);

      this.currentTimestamp =
        this.startTimestamp +
        Math.round(this.playBarOffsetX / pxPerMs);

      this.drawPalyBar();
      this.init(this.startTimestamp, this.timecell, true);

      this.gIsMousemove = true;
      this.gMousedownCursor = posX;

      // console.log(DateUtil.formatDate(
      //   new Date(this.currentTimestamp),
      //   'YYYY-MM-DD HH:mm:ss'
      // ));
      //  this.timeChange.emit(this.currentTimestamp)
      this.mouseUp.emit(this.currentTimestamp);

    } else {

      const time = this.startTimestamp + posX / pxPerMs;

      this.drawPalyBar();
      this.init(this.startTimestamp, this.timecell, true);
      this.drawLine(posX, 0, posX, 50, 'rgb(102, 20, 0)', 1);

      this.ctx.fillStyle = 'rgb(102, 20, 0)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        DateUtil.formatDate(
          new Date(time),
          'YYYY-MM-DD HH:mm:ss'
        ),
        posX,
        (this.scale * 3)
      );
    }
  }

  /**
   * Drag/click the Mouseup event
   */
  mouseupFunc(e: MouseEvent): void {
    if (this.gIsMousemove) {
      // Drag events
      this.gIsMousemove = false;
      this.gIsMousedown = false;
      this.playTime =
        this.startTimestamp + this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000;
    } else {
      // Click event
      this.gIsMousedown = false;

      // Mouse distance (px)
      const posx = this.get_cursor_x_position(e).posX;

      // ms/px
      const msPerPx = (this.zoom * 3600 * 1000) / this.canvasW;

      this.playTime = this.startTimestamp + posx * msPerPx;
      this.set_time_to_middle(this.playTime);


    }
    const formattedDate = DateUtil.formatDate(
      new Date(this.playTime),
      'YYYY-MM-DD HH:mm:ss'
    );
    
    const filename = this.isTimeInPlayback(formattedDate);
    
    if (filename) {
      this.SendFileForPlayback.emit(filename);
      console.log(`Time ${formattedDate} is within playback range. Filename: ${filename}`);
    } else {
      console.log(`Time ${formattedDate} is not within any playback range`);
    }

    // this.isUserInteracting = false;
    //  this.timeChange.emit(this.playTime);
    this.mouseDown.emit(this.playTime);
  }

  isTimeInPlayback(checkTime: string | Date): string | null {
    const timeToCheck = new Date(checkTime);
    
    const matchingEntry = this.MytimelineEntries.find(range => 
      timeToCheck >= range.startTime && timeToCheck <= range.endTime
    );
    
    return matchingEntry ? matchingEntry.filename : null;
  }

  
  /**
   * Mouseout of the hidden time mouseout event
   */
  mouseoutFunc(): void {
    this.clearCanvas();
    // px/ms
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);
    this.currentTimestamp =
      this.startTimestamp +
      Math.round(this.playBarOffsetX / pxPerMs);

    this.drawPalyBar();
    this.init(this.startTimestamp, this.timecell, true);
  }

  /**
   * Scroll to the center of the timeline for the mousewheel event
   */
  mousewheelFunc(event: any): boolean {
    if (event && event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
      return false;
    }

    const e = window.event || event;
    const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    // console.log("playBarDistanceLeft : " + this.playBarDistanceLeft);
    // Ms Remember the current middle time
    const middleTime =
      this.startTimestamp + (this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000);
    if (delta < 0) {
      if (this.zoom == 1) {
        this.zoom += 3;
      } else if (this.zoom >= 24) {
        this.zoom = 24;
      } else {
        this.zoom = this.zoom + 4;
      }
      this.hoursPerRuler = this.zoom;
    } else if (delta > 0) {
      // amplification
      this.zoom = this.zoom - 4;
      if (this.zoom <= 1) {
        // Zoom in at most one hour
        this.zoom = 1;
      }
      this.hoursPerRuler = this.zoom;
    }
    this.zoomLevel.emit(this.zoom)
    // console.log("Zoom Level :" + this.zoom);
    this.clearCanvas();
    // startTimestamp = current middle time - zoom /2
    this.startTimestamp =
      middleTime - (this.hoursPerRuler * 3600 * 1000) / 2;
    // console.log("zoomTime : " + DateUtil.formatDate(new Date(this.startTimestamp), 'YYYY-MM-DD HH:mm:ss'));
    this.init(this.startTimestamp, this.timecell, true);
    this.drawPalyBar();
    return true;
  }

  onDurationChange(hours: number) {
    const middleTime = this.startTimestamp + (this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000);
    this.hoursPerRuler = this.zoom = hours;
    console.log("Zoom Level :" + this.zoom);
    this.clearCanvas();
    // // startTimestamp = current middle time - zoom /2
    this.startTimestamp =
      middleTime - (this.hoursPerRuler * 3600 * 1000) / 2;

    this.init(this.startTimestamp, this.timecell, true);
    this.drawPalyBar();
  }

  /**
   * Get the mouse POSx
   * @param  e event
   */
  get_cursor_x_position(e: any): CanvasPos {
    let posx = 0;
    let posy = 0;

    if (!e) {
      e = window.event;
    }
    if (e.offsetX || e.offsetY) {
      posx = e.offsetX;
      posy = e.offsetY;
    }

    return { posX: posx, posY: posy };
  }

  /**
   * The offset of the left start time, returns the unit ms
   * @param  timestamp The time stamp
   * @param  step The offset
   */
  ms_to_next_step(timestamp: number, step: number): number {
    const remainder = timestamp % step;
    return remainder ? step - remainder : 0;
  }

  /**
   * Set the time to jump to the middle red line
   *  @param  time Unit of ms
   */
  set_time_to_middle(time: number): void {
    if (this.ctx) {
      this.clearCanvas();
      this.startTimestamp = time - (this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000);
      this.currentTimestamp = time;
      this.drawPalyBar();
      // console.log("set_time_to_middle : " + DateUtil.formatDate(
      //   new Date(this.currentTimestamp),
      //   'YYYY-MM-DD HH:mm:ss'
      // ));
      this.init(this.startTimestamp, this.timecell, true);
      // this.timeChange.emit(this.currentTimestamp);
    }
  }

  /**
   * To redraw on a canvas, it must first be cleared.
   */
  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasW, (this.scale * 7.5));
  }
  /**
   * Click to play
   */

  onPlayClick(): void {
    this.isPlayClick = true;
    this.setTimeMove = interval(this.speed).subscribe((d: any) => {
      this.playTime = Number(this.playTime) + 1 * 1000;
      console.log("playTime :" + this.playTime);
      this.playClick.emit(this.playTime);
      this.set_time_to_middle(this.playTime);
    });
    this.playTime = Number(this.playTime) * 1000;
    this.set_time_to_middle(this.playTime);
  }
  /**
   * Click on the pause
   */
  onPauseClick(): void {
    this.isPlayClick = false;
    if (this.setTimeMove) {
      // this.setTimeMove = undefined;
      this.setTimeMove.unsubscribe();
      this.playClick.emit(this.playTime);
    }
  }
  /**
   * Change video segment
   */

  /**
   * Temporary unused
   * @param event MatDatepickerInputEvent(Date)
   */
  selectedTime(event: any): void {
    const timestamp = new Date(event.value.getTime());
    this.set_time_to_middle(Number(timestamp));
  }

  /**
   * Temporary unused
   * @param event MouseEvent
   */
  onDragStart(e: MouseEvent): boolean {
    e.preventDefault();
    return false;
  }
}

