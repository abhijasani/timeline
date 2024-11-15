export interface CanvasPos {
    posX: number;
    posY: number;
  }
  
  export interface VideoCellStyleType {
    background: string;
  }
  
  export interface VideoCellType {
    beginTime: number | string | Date;
    endTime: number | string | Date;
    style?: VideoCellStyleType;
  }
  
  export interface PlaybackEntryType {
    startTime: Date;
    endTime: Date;
    filename: string;
  }
  