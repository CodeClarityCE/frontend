import { toast } from "vue-sonner";

import { APIErrors } from "./ApiErrors";

/** The header the API requires on every request it judges on the session cookies. */
export const CSRF_HEADER = "X-CodeClarity-CSRF";

// Parses a JSON body; a 204 or an empty body gives undefined.
async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  return text === "" ? undefined : (JSON.parse(text) as unknown);
}

/**
 * @class BaseRepository
 *
 * @classdesc
 * A base class for respository classes that abstracts access to API calls.
 *
 */
export class BaseRepository {
  private BASE_URL: string;

  constructor() {
    this.BASE_URL = `https://${window.location.host}/${import.meta.env.VITE_API_URL}`;
  }

  /**
   * @returns {string} - BASE API Url
   */
  private getBaseUrl(): string {
    return this.BASE_URL;
  }

  /**
   * Attach query params
   * @param {QueryParams|undefined} queryParams Query paramaters
   */
  private attachSearchParams(
    searchParams: URLSearchParams,
    queryParams?: QueryParams,
  ): void {
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (Array.isArray(value)) {
          value.forEach((value) => searchParams.append(key, value.toString()));
        } else {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        }
      }
    }
  }

  /**
   * Builds an absolute URL that points to the API.
   *
   * @param {string} relativeUrl - Endpoint url
   * @returns {string} - URL of the endpoint
   */
  protected buildUrl(relativeUrl: string): string {
    if (relativeUrl.startsWith("/"))
      return `${this.getBaseUrl()}${relativeUrl}`;
    else return `${this.getBaseUrl()}/${relativeUrl}`;
  }

  /**
   * Prepares a request for the web sign-in: adds the header the API requires
   * on cookie requests (ADR 0025), and refreshes the cookies first when the
   * access token is about to expire. A refused refresh signs the user out.
   */
  protected async attachSession(
    headers: Headers,
    options: { skipSessionRefresh?: boolean | undefined },
  ): Promise<void> {
    headers.append(CSRF_HEADER, "1");
    if (options.skipSessionRefresh) return;
    // Loaded here because the session module imports the auth store, which imports this one.
    const { ensureFreshSession } = await import("./session");
    await ensureFreshSession();
  }

  /** Send a GET with the query params, the session's cookies and extra headers. */
  private async sendGet(options: GetRequestOptions): Promise<Response> {
    // Construct the url, including query parameters
    const url = new URL(options.url);
    this.attachSearchParams(url.searchParams, options.queryParams);

    // Construct headers
    const headers = new Headers();

    // A web sign-in travels in its cookies, with the header the API requires.
    await this.attachSession(headers, options);

    // Attach additional headers
    if (options.headers) {
      for (const header of options.headers) {
        headers.append(header[0], header[1]);
      }
    }

    return fetch(url.toString(), {
      method: "GET",
      headers,
      credentials: "same-origin",
    });
  }

  /**
   * Get Request.
   *
   * @param {GetRequestOptions} options Get request options
   * @param {string} options.url url
   * @param {QueryParams|undefined} options.queryParams object that contains all the query params using key/value pairs
   * @param {function(T)|undefined} options.success callback on success
   * @param {function()|undefined} options.finalize callback on when request is finished (both on success and error)
   * @param {function(BusinessLogicError)|undefined} [options.businessLogicError=this.defaultBusinessErrorHandler] callback on business logic errors (api errors). Default: defaultBusinessErrorHandler.
   * @param {function(HttpError)|undefined} [options.httpError=this.defaultHttpErrorHandler] callback on http errors (protocol errors). Default: defaultHttpErrorHandler.
   * @param {function(any)|undefined} [options.error=this.defaultErrorHandler] callback on network and marshalling/unmarshalling errors. Default: defaultErrorHandler.
   * @param {string} options.defaultBusinessLogicErrorHandlerTextPrefix In case you want the default business error handler to handle the error but you wish to add some defined prefix to the error message it shows to users.
   */
  protected async getRequest<R>(options: GetRequestOptions): Promise<R> {
    const response = await this.sendGet(options);
    const result = (await readBody(response)) as R;

    // Check the response
    if (response.ok) {
      // Status code 2xx
      return result;
    } else {
      // Status code 1xx, 3xx, 4xx, 5xx
      this.errorHandler({
        request: {
          status: response.status,
          statusText: response.statusText,
          responseBody: result,
        },
        handleBusinessErrors: options.handleBusinessErrors,
        handleHTTPErrors: options.handleHTTPErrors,
        defaultBusinessLogicErrorHandlerTextPrefix:
          options.defaultBusinessLogicErrorHandlerTextPrefix,
      });
    }
  }

  /**
   * Get Request for a file: same as getRequest, but resolves to the response
   * body as a Blob (exports, downloads that need the session).
   * Error responses go through the usual error handling.
   *
   * @param {GetRequestOptions} options Get request options
   */
  protected async getBlobRequest(options: GetRequestOptions): Promise<Blob> {
    const response = await this.sendGet(options);
    if (response.ok) return await response.blob();

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }
    this.errorHandler({
      request: {
        status: response.status,
        statusText: response.statusText,
        responseBody,
      },
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      defaultBusinessLogicErrorHandlerTextPrefix:
        options.defaultBusinessLogicErrorHandlerTextPrefix,
    });
  }

  /**
   * Post Request.
   *
   * @param {GetRequestOptions} options Get request options
   * @param {string} options.url url
   * @param {QueryParams|undefined} options.queryParams object that contains all the query params using key/value pairs
   * @param {any|undefined} options.data the post body
   * @param {function(T)|undefined} options.success callback on success
   * @param {function()|undefined} options.finalize callback on when request is finished (both on success and error)
   * @param {function(BusinessLogicError)|undefined} [options.businessLogicError=this.defaultBusinessErrorHandler] callback on business logic errors (api errors). Default: defaultBusinessErrorHandler.
   * @param {function(HttpError)|undefined} [options.httpError=this.defaultHttpErrorHandler] callback on http errors (protocol errors). Default: defaultHttpErrorHandler.
   * @param {function(any)|undefined} [options.error=this.defaultErrorHandler] callback on network and marshalling/unmarshalling errors. Default: defaultErrorHandler.
   * @param {string} options.defaultBusinessLogicErrorHandlerTextPrefix In case you want the default business error handler to handle the error but you wish to add some defined prefix to the error message it shows to users.
   */
  protected async postRequest<R, P>(
    options: PostRequestOptions<P>,
  ): Promise<R> {
    // Construct the url, including query parameters
    const url = new URL(options.url);
    this.attachSearchParams(url.searchParams, options.queryParams);

    // Construct headers
    const headers = new Headers();
    headers.append("Accepts", "application/json");
    headers.append("Content-Type", "application/json");

    // A web sign-in travels in its cookies, with the header the API requires.
    await this.attachSession(headers, options);

    // Attach additional headers
    if (options.headers) {
      for (const header of options.headers) {
        headers.append(header[0], header[1]);
      }
    }

    // Construct fetch options
    const fetchOptions: RequestInit = {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
    };

    if (options.data) {
      fetchOptions.body = JSON.stringify(options.data);
    }

    // Send the request
    const response = await fetch(url.toString(), fetchOptions);
    const result = (await readBody(response)) as R;

    // Check the response
    if (response.ok) {
      // Status code 2xx
      return result;
    } else {
      // Status code 1xx, 3xx, 4xx, 5xx
      this.errorHandler({
        request: {
          status: response.status,
          statusText: response.statusText,
          responseBody: result,
        },
        handleBusinessErrors: options.handleBusinessErrors,
        handleHTTPErrors: options.handleHTTPErrors,
        defaultBusinessLogicErrorHandlerTextPrefix:
          options.defaultBusinessLogicErrorHandlerTextPrefix,
      });
    }
  }

  /**
   * Delete Request.
   *
   * @param {GetRequestOptions} options Get request options
   * @param {string} options.url url
   * @param {QueryParams|undefined} options.queryParams object that contains all the query params using key/value pairs
   * @param {function(T)|undefined} options.success callback on success
   * @param {function()|undefined} options.finalize callback on when request is finished (both on success and error)
   * @param {function(BusinessLogicError)|undefined} [options.businessLogicError=this.defaultBusinessErrorHandler] callback on business logic errors (api errors). Default: defaultBusinessErrorHandler.
   * @param {function(HttpError)|undefined} [options.httpError=this.defaultHttpErrorHandler] callback on http errors (protocol errors). Default: defaultHttpErrorHandler.
   * @param {function(any)|undefined} [options.error=this.defaultErrorHandler] callback on network and marshalling/unmarshalling errors. Default: defaultErrorHandler.
   * @param {string} options.defaultBusinessLogicErrorHandlerTextPrefix In case you want the default business error handler to handle the error but you wish to add some defined prefix to the error message it shows to users.
   */
  protected async deleteRequest<R, P>(
    options: DeleteRequestOptions<P>,
  ): Promise<R> {
    // Construct the url, including query parameters
    const url = new URL(options.url);
    this.attachSearchParams(url.searchParams, options.queryParams);

    // Construct headers
    const headers = new Headers();
    headers.append("Accepts", "application/json");

    // Only add Content-Type if we have data to send
    if (options.data) {
      headers.append("Content-Type", "application/json");
    }

    // A web sign-in travels in its cookies, with the header the API requires.
    await this.attachSession(headers, options);

    // Attach additional headers
    if (options.headers) {
      for (const header of options.headers) {
        headers.append(header[0], header[1]);
      }
    }

    // Construct fetch options
    const fetchOptions: RequestInit = {
      method: "DELETE",
      headers: headers,
      credentials: "same-origin",
    };

    if (options.data) {
      fetchOptions.body = JSON.stringify(options.data);
    }

    // Send the request
    const response = await fetch(url.toString(), fetchOptions);
    const result = (await readBody(response)) as R;

    // Check the response
    if (response.ok) {
      // Status code 2xx
      return result;
    } else {
      // Status code 1xx, 3xx, 4xx, 5xx
      this.errorHandler({
        request: {
          status: response.status,
          statusText: response.statusText,
          responseBody: result,
        },
        handleBusinessErrors: options.handleBusinessErrors,
        handleHTTPErrors: options.handleHTTPErrors,
        defaultBusinessLogicErrorHandlerTextPrefix:
          options.defaultBusinessLogicErrorHandlerTextPrefix,
      });
    }
  }

  /**
   * PUT Request.
   *
   * @param {GetRequestOptions} options Get request options
   * @param {string} options.url url
   * @param {QueryParams|undefined} options.queryParams object that contains all the query params using key/value pairs
   * @param {any|undefined} options.data the put body
   * @param {function(T)|undefined} options.success callback on success
   * @param {function()|undefined} options.finalize callback on when request is finished (both on success and error)
   * @param {function(BusinessLogicError)|undefined} [options.businessLogicError=this.defaultBusinessErrorHandler] callback on business logic errors (api errors). Default: defaultBusinessErrorHandler.
   * @param {function(HttpError)|undefined} [options.httpError=this.defaultHttpErrorHandler] callback on http errors (protocol errors). Default: defaultHttpErrorHandler.
   * @param {function(any)|undefined} [options.error=this.defaultErrorHandler] callback on network and marshalling/unmarshalling errors. Default: defaultErrorHandler.
   * @param {string} options.defaultBusinessLogicErrorHandlerTextPrefix In case you want the default business error handler to handle the error but you wish to add some defined prefix to the error message it shows to users.
   */
  protected async putRequest<R, P>(options: PutRequestOptions<P>): Promise<R> {
    // Construct the url, including query parameters
    const url = new URL(options.url);
    this.attachSearchParams(url.searchParams, options.queryParams);

    // Construct headers
    const headers = new Headers();
    headers.append("Accepts", "application/json");
    headers.append("Content-Type", "application/json");

    // A web sign-in travels in its cookies, with the header the API requires.
    await this.attachSession(headers, options);

    // Attach additional headers
    if (options.headers) {
      for (const header of options.headers) {
        headers.append(header[0], header[1]);
      }
    }

    // Construct fetch options
    const fetchOptions: RequestInit = {
      method: "PUT",
      headers: headers,
      credentials: "same-origin",
    };

    if (options.data) {
      fetchOptions.body = JSON.stringify(options.data);
    }

    // Send the request
    const response = await fetch(url.toString(), fetchOptions);
    const result = (await readBody(response)) as R;

    // Check the response
    if (response.ok) {
      // Status code 2xx
      return result;
    } else {
      // Status code 1xx, 3xx, 4xx, 5xx
      this.errorHandler({
        request: {
          status: response.status,
          statusText: response.statusText,
          responseBody: result,
        },
        handleBusinessErrors: options.handleBusinessErrors,
        handleHTTPErrors: options.handleHTTPErrors,
        defaultBusinessLogicErrorHandlerTextPrefix:
          options.defaultBusinessLogicErrorHandlerTextPrefix,
      });
    }
  }

  /**
   * Patch Request.
   *
   * @param {GetRequestOptions} options Get request options
   * @param {string} options.url url
   * @param {QueryParams|undefined} options.queryParams object that contains all the query params using key/value pairs
   * @param {any|undefined} options.data the patch body
   * @param {function(T)|undefined} options.success callback on success
   * @param {function()|undefined} options.finalize callback on when request is finished (both on success and error)
   * @param {function(BusinessLogicError)|undefined} [options.businessLogicError=this.defaultBusinessErrorHandler] callback on business logic errors (api errors). Default: defaultBusinessErrorHandler.
   * @param {function(HttpError)|undefined} [options.httpError=this.defaultHttpErrorHandler] callback on http errors (protocol errors). Default: defaultHttpErrorHandler.
   * @param {function(any)|undefined} [options.error=this.defaultErrorHandler] callback on network and marshalling/unmarshalling errors. Default: defaultErrorHandler.
   * @param {string} options.defaultBusinessLogicErrorHandlerTextPrefix In case you want the default business error handler to handle the error but you wish to add some defined prefix to the error message it shows to users.
   */
  protected async patchRequest<R, P>(
    options: PatchRequestOptions<P>,
  ): Promise<R> {
    // Construct the url, including query parameters
    const url = new URL(options.url);
    this.attachSearchParams(url.searchParams, options.queryParams);

    // Construct headers
    const headers = new Headers();
    headers.append("Accepts", "application/json");
    headers.append("Content-Type", "application/json");

    // A web sign-in travels in its cookies, with the header the API requires.
    await this.attachSession(headers, options);

    // Attach additional headers
    if (options.headers) {
      for (const header of options.headers) {
        headers.append(header[0], header[1]);
      }
    }

    // Construct fetch options
    const fetchOptions: RequestInit = {
      method: "PATCH",
      headers: headers,
      credentials: "same-origin",
    };

    if (options.data) {
      fetchOptions.body = JSON.stringify(options.data);
    }

    // Send the request
    const response = await fetch(url.toString(), fetchOptions);
    const result = (await readBody(response)) as R;

    // Check the response
    if (response.ok) {
      // Status code 2xx
      return result;
    } else {
      // Status code 1xx, 3xx, 4xx, 5xx
      this.errorHandler({
        request: {
          status: response.status,
          statusText: response.statusText,
          responseBody: result,
        },
        handleBusinessErrors: options.handleBusinessErrors,
        handleHTTPErrors: options.handleHTTPErrors,
        defaultBusinessLogicErrorHandlerTextPrefix:
          options.defaultBusinessLogicErrorHandlerTextPrefix,
      });
    }
  }

  /**
   * Error parser for a failed API request.
   *
   * @param {Object} options - Options
   * @param {Object} options.request - Request Objects
   * @param {Object} options.request.xhr - jqXHR object
   * @param {string} options.request.error -  When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
   * @param {Object} options.handleBusinessErrors - Options
   * @param {Object} options.handleHTTPErrors - Options
   * @param {string} options.defaultBusinessLogicErrorHandlerTextPrefix In case you want the default business error handler to handle the error but you wish to add some defined prefix to the error message it shows to users.
   */
  private errorHandler(options: ErrorHandlerOptions): never {
    const status = options.request.status;
    const statusText = options.request.statusText;
    const responseBody = options.request.responseBody;

    if (isApiErrorResponse(responseBody)) {
      if (responseBody.error_code === (APIErrors.NotAuthenticated as string)) {
        // Loaded here because the router imports every repository through its views.
        void import("@/router").then(({ default: router }) =>
          router.push("/login"),
        );
      }

      let business_logic_error = new BusinessLogicError(
        responseBody.error_code,
        responseBody.error_message,
      );

      if (
        business_logic_error.error_code ===
        (APIErrors.ValidationFailed as string)
      ) {
        business_logic_error = new ValidationError(
          responseBody.error_code,
          responseBody.error_message,
          responseBody.validation_errors ?? [],
        );
      }

      if (
        options.handleBusinessErrors !== undefined &&
        options.handleBusinessErrors === true
      ) {
        throw business_logic_error;
      } else {
        void this.defaultBusinessErrorHandler(
          business_logic_error,
          options.defaultBusinessLogicErrorHandlerTextPrefix,
        );
        throw business_logic_error;
      }
    } else {
      const http_error = new HttpError(status, statusText);
      if (
        options.handleHTTPErrors !== undefined &&
        options.handleHTTPErrors === true
      ) {
        throw http_error;
      } else {
        void this.defaultHttpErrorHandler(http_error);
        throw http_error;
      }
    }
  }

  /**
   * Default business error handler that runs in case no business error handler was supplied by the user.
   */
  private async defaultBusinessErrorHandler(
    _business_logic_error: BusinessLogicError,
    defaultBusinessLogicErrorHandlerTextPrefix?: string,
  ): Promise<void> {
    // Plain words only: the error code and server reason mean nothing to users.
    toast.error(
      defaultBusinessLogicErrorHandlerTextPrefix ??
        "The request could not be processed. Please try again.",
    );
  }

  /**
   * Default http error handler that runs in case no http error handler was supplied by the user.
   */
  private async defaultHttpErrorHandler(_http_error: HttpError): Promise<void> {
    toast.error(
      "Request failed to be processed. Please reload the page and try again.",
    );
  }
}

/**
 * Object that represents a Business Logic Error from a API Call
 * @name BusinessLogicError
 *
 * @typedef {Object} BusinessLogicError
 *
 * @property {string} error_code - API Error Name
 * @property {string} error_message - API Error elaboration message
 *
 * @param {string} error_code - API Error Name
 * @param {string} error_message - API Error elaboration message
 */
export class BusinessLogicError extends Error {
  error_code: string;
  error_message: string;

  constructor(error_code: string, error_message: string /* mitigation: any*/) {
    super(error_message);
    this.error_code = error_code;
    this.error_message = error_message;
    this.name = "BusinessLogicError";
  }
}

interface ValidationErrorDetail {
  property: string;
  errors: string[];
}

interface ApiErrorResponse {
  error_code: string;
  error_message: string;
  validation_errors?: ValidationErrorDetail[];
}

function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "error_code" in obj &&
    "error_message" in obj &&
    typeof (obj as ApiErrorResponse).error_code === "string" &&
    typeof (obj as ApiErrorResponse).error_message === "string"
  );
}

export class ValidationError extends BusinessLogicError {
  validation_errors: ValidationErrorDetail[];

  constructor(
    error_code: string,
    error_message: string,
    validation_errors: ValidationErrorDetail[] /* mitigation: any*/,
  ) {
    super(error_code, error_message);
    this.validation_errors = validation_errors;
  }

  toMessage(prefix: string): string {
    let message = `${prefix}\n`;
    for (const validationError of this.validation_errors) {
      for (const error of validationError.errors) {
        message += `  - ${error}\n`;
      }
    }
    return message;
  }
}

// True when fetch failed before the API answered.
export function gotNoAnswer(error: unknown): boolean {
  return !(error instanceof BusinessLogicError || error instanceof HttpError);
}

/**
 * Object that represents a HTTP Error from a API Call
 * @name HttpError
 *
 * @typedef {Object} HttpError
 *
 * @property {number} code - HTTP status code.
 * @property {string} status - When an HTTP error occurs, status receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
 *
 * @param {number} code - HTTP status code.
 * @param {string} status - When an HTTP error occurs, status receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
 */
export class HttpError extends Error {
  code: number;
  status: string;

  constructor(code: number, status: string) {
    super(`HTTP Error ${code}: ${status}`);
    this.code = code;
    this.status = status;
    this.name = "HttpError";
  }
}

type QueryParams = Record<
  string,
  string | number | undefined | string[] | number[]
>;

interface RequestOptions {
  url: string;
  headers?: Headers;
  // Set only on the refresh itself, which must not wait for a refresh.
  skipSessionRefresh?: boolean | undefined;
  queryParams?: QueryParams;
  handleBusinessErrors?: boolean | undefined;
  handleHTTPErrors?: boolean | undefined;
  handleOtherErrors?: boolean | undefined;
  defaultBusinessLogicErrorHandlerTextPrefix?: string;
}

interface GetRequestOptions extends RequestOptions {}
interface PostRequestOptions<P> extends RequestOptions {
  data: P;
}
interface DeleteRequestOptions<P> extends RequestOptions {
  data: P;
}
interface PutRequestOptions<P> extends RequestOptions {
  data: P;
}
interface PatchRequestOptions<P> extends RequestOptions {
  data: P;
}

interface ErrorHandlerOptions {
  request: {
    status: number;
    statusText: string;
    responseBody: unknown;
  };
  handleBusinessErrors?: boolean;
  handleHTTPErrors?: boolean;
  defaultBusinessLogicErrorHandlerTextPrefix?: string;
}

export interface RepoMethodOptions {
  headers?: Headers;
  queryParams?: QueryParams;
  handleBusinessErrors?: boolean | undefined;
  handleHTTPErrors?: boolean | undefined;
  handleOtherErrors?: boolean | undefined;
  defaultBusinessLogicErrorHandlerTextPrefix?: string;
}

// Requests on the web sign-in; its cookies go with every request.
interface AuthenticatedRepoMethodOptions extends RepoMethodOptions {}

export interface RepoMethodPostRequestOptions<P> extends RepoMethodOptions {
  data: P;
}

export interface AuthRepoMethodGetRequestOptions extends AuthenticatedRepoMethodOptions {}
export interface AuthRepoMethodPostRequestOptions<
  P,
> extends AuthenticatedRepoMethodOptions {
  data: P;
}
export interface AuthRepoMethodEmptyPostRequestOptions extends AuthenticatedRepoMethodOptions {}
export interface AuthRepoMethodEmptyDeleteRequestOptions extends AuthenticatedRepoMethodOptions {}
export interface AuthRepoMethodDeleteRequestOptions<
  P,
> extends AuthenticatedRepoMethodOptions {
  data: P;
}
export interface AuthRepoMethodPutRequestOptions<
  P,
> extends AuthenticatedRepoMethodOptions {
  data: P;
}
export interface AuthRepoMethodPatchRequestOptions<
  P,
> extends AuthenticatedRepoMethodOptions {
  data: P;
}

export interface PaginatedRepoMethodRequestOptions {
  pagination: {
    page: number;
    entries_per_page: number;
  };
}

export interface SearchableRepoMethodRequestOptions {
  search: {
    searchKey: string;
  };
}

export interface SortableRepoMethodRequestOptions {
  sort: {
    sortKey: string;
    sortDirection?: string;
  };
}

export interface EmptyPostData {}
