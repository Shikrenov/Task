import { gsap } from 'gsap';

export function playTimeline(timeline: gsap.core.Timeline): Promise<void> {
  return new Promise((resolve) => {
    timeline.eventCallback('onComplete', resolve);
    timeline.play(0);
  });
}

export function waitUsingGsap(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    gsap.delayedCall(seconds, resolve);
  });
}
