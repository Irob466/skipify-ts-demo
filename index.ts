import "whatwg-fetch";
import axios from "axios";

/** basic typing */

let x: number;

// x = "1";
x = 1;
console.log(x);

function sum(a: number, b: number): number | string {
  return a + b;
}

/** interface demo */

type User = {
  name: string;
  email: string;
  //   tags: string[];
  //   tags: Array<string>;
  friends: User[];
};

type RestOptions = {
  headers?: Record<string, string>;
  mode?: "cors" | "no-cors" | "same-origin";
  cache?: "default" | "no-store" | "reload" | "no-cache" | "force-cache";
};

interface IRest {
  get: (path: string, opts?: RestOptions) => Promise<User>;
  post: (
    path: string,
    body: object | string,
    opts?: RestOptions
  ) => Promise<User>;
}

class FetchRest implements IRest {
  get(path: string, opts: RestOptions = {}): Promise<User> {
    const init: RequestInit = {
      headers: opts.headers,
      mode: opts.mode,
      cache: opts.cache,
      method: "GET",
    };

    return fetch(path, init).then((res) => res.json() as Promise<User>);
  }

  post(
    path: string,
    body: object | string,
    opts: RestOptions = {}
  ): Promise<User> {
    const init: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...opts.headers,
      },
      mode: opts.mode,
      cache: opts.cache,
      method: "POST",
    };
    let bodyJson: string;
    if (typeof body === "object") {
      bodyJson = JSON.stringify(body);
    } else {
      bodyJson = body;
    }
    init.body = bodyJson;
    return fetch(path, init).then((res) => res.json() as Promise<User>);
  }
}

class AxiosRest implements IRest {
  get(path: string, opts?: RestOptions): Promise<User> {
    return axios.get<User>(path, opts).then((res) => res.data);
  }
  post(path: string, body: string | object, opts?: RestOptions): Promise<User> {
    return axios.post<User>(path, body, opts).then((res) => res.data);
  }
}

class App {
  rest: IRest;
  constructor(rest: IRest) {
    this.rest = rest;
  }

  login(username: string, password: string): Promise<User> {
    return this.rest.post("/login", { username, password });
  }
}

const username = "test@skipify.com";
const password = "password";

const fetchApp = new App(new FetchRest());
const axiosApp = new App(new AxiosRest());
