import { TestBed } from '@angular/core/testing';

import { VideoDecodeService } from './video-decode.service';

describe('VideoDecodeService', () => {
  let service: VideoDecodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoDecodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
