use serde_json::json;
use wasmbus_rpc::actor::prelude::*;
use wasmcloud_interface_httpserver::{HttpRequest, HttpResponse, HttpServer, HttpServerReceiver};
use wasmcloud_interface_keyvalue::{IncrementRequest, KeyValue, KeyValueSender};

mod ui;
use ui::get_asset;

#[derive(Debug, Default, Actor, HealthResponder)]
#[services(Actor, HttpServer)]
struct kv_streamerActor {}

/// Implementation of HttpServer trait methods
#[async_trait]
impl HttpServer for kv_streamerActor {
    async fn handle_request(&self, ctx: &Context, req: &HttpRequest) -> RpcResult<HttpResponse> {
        let trimmed_path: Vec<&str> = req.path.trim_matches('/').split('/').collect();

        match (req.method.as_ref(), trimmed_path.as_slice()) {
            ("GET", ["api", "counter"]) => get_counter(ctx, "default").await,
            ("GET", ["api", "counter", counter]) => get_counter(ctx, counter).await,
            ("POST", ["api", "counter"]) => increment_counter(ctx, "default", 1).await,
            ("POST", ["api", "counter", counter]) => increment_counter(ctx, counter, 3).await,
            // Any other GET request is interpreted as a static asset request for the UI
            ("GET", asset_path) => get_asset(asset_path.join("/")),
            (_, _) => Ok(HttpResponse::not_found()),
        }
    }
}

/// get the `key` in the KeyValue store 
async fn get_counter(ctx: &Context, counter: &str) -> RpcResult<HttpResponse> {
    // make friendlier key
    let key = format!("counter:{}", counter.replace('/', ":"));

    // get the value in kv and format response as json
    let (body, status_code) = match KeyValueSender::new()
        .get(ctx, &key)
        .await
    {
        Ok(v) => (json!({ "counter": v.value }).to_string(), 200),
        // if we caught an error, return it to client
        Err(e) => (json!({ "error": e.to_string() }).to_string(), 500),
    };

    Ok(HttpResponse {
        body: body.as_bytes().to_vec(),
        status_code,
        ..Default::default()
    })
}

/// Increment the `key` in the KeyValue store by `value`
async fn increment_counter(ctx: &Context, counter: &str, value: i32) -> RpcResult<HttpResponse> {
    // make friendlier key
    let key = format!("counter:{}", counter.replace('/', ":"));

    // increment the value in kv and format response as json
    let (body, status_code) = match KeyValueSender::new()
        .increment(ctx, &IncrementRequest { key, value })
        .await
    {
        Ok(v) => (json!({ "counter": v }).to_string(), 200),
        // if we caught an error, return it to client
        Err(e) => (json!({ "error": e.to_string() }).to_string(), 500),
    };

    Ok(HttpResponse {
        body: body.as_bytes().to_vec(),
        status_code,
        ..Default::default()
    })
}
