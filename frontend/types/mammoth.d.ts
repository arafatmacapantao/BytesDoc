declare module 'mammoth/mammoth.browser' {
  interface ConvertResult {
    value: string
    messages: Array<{ type: string; message: string }>
  }
  interface ConvertOptions {
    arrayBuffer?: ArrayBuffer
    buffer?: ArrayBuffer
  }
  export function convertToHtml(input: ConvertOptions): Promise<ConvertResult>
  export function extractRawText(input: ConvertOptions): Promise<ConvertResult>
}
