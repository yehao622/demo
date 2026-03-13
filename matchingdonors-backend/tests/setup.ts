// Set NODE_ENV to test before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.GEMINI_API_KEY = 'dummy_key_just_to_pass_the_error_check';
process.env.RESEND_API_KEY = 'dummy_key_just_to_pass_the_error_check';

import { TextEncoder, TextDecoder } from 'util';

// 1. Polyfill TextEncoder/TextDecoder
Object.assign(global, { TextDecoder, TextEncoder });

// 2. Polyfill Web API globals missing in Jest's Node sandbox
if (typeof (global as any).Blob === 'undefined') {
    (global as any).Blob = class Blob { };
}
if (typeof (global as any).File === 'undefined') {
    (global as any).File = class File extends (global as any).Blob { };
}
if (typeof (global as any).Headers === 'undefined') {
    (global as any).Headers = class Headers { };
}
if (typeof (global as any).Request === 'undefined') {
    (global as any).Request = class Request { };
}
if (typeof (global as any).Response === 'undefined') {
    (global as any).Response = class Response { };
}
if (typeof (global as any).fetch === 'undefined') {
    (global as any).fetch = function () { return Promise.resolve(); };
}