import { vi } from "vitest";

type Listener = (event: never) => void;

export class FakeWebSocket {
  static readonly instances: FakeWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  private readonly listeners = new Map<string, Set<Listener>>();

  url: string;
  readyState = FakeWebSocket.CONNECTING;
  close = vi.fn((code?: number) => {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatch("close", { code: code ?? 1000 });
  });

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  private dispatch(type: string, event: unknown) {
    const listenersForType = this.listeners.get(type) ?? [];
    for (const listener of listenersForType) {
      listener(event as never);
    }
  }

  addEventListener(type: string, listener: Listener) {
    const forType = this.listeners.get(type) ?? new Set<Listener>();
    forType.add(listener);
    this.listeners.set(type, forType);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatch("open", {});
  }

  receive(event: string, data: unknown) {
    this.dispatch("message", { data: JSON.stringify({ event, data }) });
  }

  failToClose(code: number) {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatch("close", { code });
  }
}
