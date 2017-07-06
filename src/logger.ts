// export function log(...args: any[]) {
//     console.log.apply(console, args)
// }

export function warn(...args: any[]) {
    console.warn.apply(console, args);
}

// export function error(...args: any[]) {
//     console.error.apply(console, args)
// }

export function serverLog(...args: any[]) {
    console.error.apply(console, args);
}

export function serverError(...args: any[]) {
    console.error.apply(console, args);
}
