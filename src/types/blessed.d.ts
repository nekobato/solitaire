declare module "blessed" {
  export interface ScreenOptions {
    smartCSR?: boolean;
    fullUnicode?: boolean;
  }

  export interface BoxOptions {
    top?: number | string;
    left?: number | string;
    bottom?: number | string;
    width?: number | string;
    height?: number | string;
    tags?: boolean;
  }

  export interface KeyEvent {
    name: string;
  }

  export interface Element {
    setContent(content: string): void;
    key(
      keys: string[] | string,
      listener: (ch: string, key: KeyEvent) => void,
    ): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
  }

  export interface Box extends Element {}

  export interface Screen extends Element {
    title: string;
    append(element: Element): void;
    render(): void;
    destroy(): void;
  }

  export function screen(options: ScreenOptions): Screen;
  export function box(options: BoxOptions): Box;
}
