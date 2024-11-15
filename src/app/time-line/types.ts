export interface AreaItem {
    startTime: number;
    endTime: number;
    bgColor?: string;
  }
  
  export interface DrawArgs {
    currentTime: number;
    areas?: AreaItem[];
    /**
     * waveform should be a [ second, value ] sorted array where the second value is between 0-100
     */
    waveform?: [number, number][];
    _privateFlag?: boolean;
  }
  
  export type Draw = (args: DrawArgs) => void;
  
  export interface ScaleHeight {
    height6: number;
    height5: number;
    height4: number;
    height3: number;
    height2: number;
    height1: number;
  }
  
  export interface TimeLineOption {
    fill?: boolean;
    width?: number;
    height?: number;
    bgColor?: string;
    textColor?: string;
    scaleColor?: string;
    scaleSpacing?: number;
    areaBgColor?: string;
    pointColor?: string;
    pointWidth?: number;
    fps?: number;
    zoom?: number;
    maxZoom?: number;
    minZoom?: number;
  }
  
  export const TIME_SPACING = [1, 1.5, 2, 2.5, 3, 5, 8, 12] as const;
  export type TIME_SPACE_ENUM = typeof TIME_SPACING[number];
  
  export interface DrawHelperOption {
    pointWidth: number;
    timePerPixel: number;
    scaleHeight: ScaleHeight;
    scaleSpacing: number;
    timeSpacing: TIME_SPACE_ENUM;
    screenScaleCount: number;
    startTime: number;
    endTime: number;
    drawLine: Function;
    drawText: Function;
  }
  
  export type DrawHelper = (option: DrawHelperOption) => void;