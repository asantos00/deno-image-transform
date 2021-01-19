// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

use deno_core::plugin_api::Interface;
use deno_core::plugin_api::Op;
use deno_core::plugin_api::ZeroCopyBuf;
use deno_core::serde_json;

use futures::future::FutureExt;

#[no_mangle]
pub fn deno_plugin_init(interface: &mut dyn Interface) {
  interface.register_op("helloWorld", hello_world);
  interface.register_op("testTextParamsAndReturn", op_test_text_params_and_return);
  interface.register_op("testJsonParamsAndReturn", op_test_json_params_and_return);
  interface.register_op("toGreyScale", op_to_grey_scale);

  interface.register_op("testSync", op_test_sync);
  interface.register_op("testAsync", op_test_async);
}

fn hello_world(
  _interface: &mut dyn Interface,
  _zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  println!("Rust: Hello from rust.");

  Op::Sync(Box::new([]))
}

fn op_test_text_params_and_return(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  for (idx, buf) in zero_copy.iter().enumerate() {
    let param_str = std::str::from_utf8(&buf[..]).unwrap();

    println!("Rust: param[{}]: {}", idx, param_str);
  }

  let result = b"result from rust";
  Op::Sync(Box::new(*result))
}

fn op_test_json_params_and_return(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  let arg0 = &mut zero_copy[0];
  let json: serde_json::Value = serde_json::from_slice(arg0).unwrap();
  let has_alpha_channel: bool = match &json[("hasAlphaChannel")] {
    serde_json::Value::Bool(b) => *b,
    _ => true,
  };
  let width = match &json["size"]["width"] {
    serde_json::Value::Number(n) => n.as_u64().unwrap_or(0),
    _ => 0,
  };
  let height = match &json["size"]["height"] {
    serde_json::Value::Number(n) => n.as_u64().unwrap_or(0),
    _ => 0,
  };

  println!("Rust: json param: {}", json);
  println!("Rust: has_alpha_channel: {}", has_alpha_channel);
  println!("Rust: width: {}", width);
  println!("Rust: height: {}", height);

  let result = serde_json::json!({
    "success": true
  });
  Op::Sync(serde_json::to_vec(&result).unwrap().into_boxed_slice())
}

fn op_to_grey_scale(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  let arg0 = &mut zero_copy[0];
  let json: serde_json::Value = serde_json::from_slice(arg0).unwrap();
  let has_alpha_channel: bool = match &json[("hasAlphaChannel")] {
    serde_json::Value::Bool(b) => *b,
    _ => true,
  };
  let pixel_size = if has_alpha_channel { RGBA_PIXEL_SIZE } else { RGB_PIXEL_SIZE };
  let arg1 = &mut zero_copy[1];
  let image_array: &mut[u8] = arg1.as_mut();

  to_grey_scale(image_array, pixel_size);

  Op::Sync(Box::new([]))
}

const RGB_PIXEL_SIZE: usize = 3;
const RGBA_PIXEL_SIZE: usize = 4;

fn to_grey_scale(image_array: &mut[u8], pixel_size: usize) {
  let image_array_length = image_array.len() - (image_array.len() % pixel_size);

  for i in (0..image_array_length).step_by(pixel_size) {
    let pixel_average = (((image_array[i] as u16) + (image_array[i + 1] as u16) + (image_array[i + 2] as u16)) / 3) as u8;
    image_array[i] = pixel_average;
    image_array[i + 1] = pixel_average;
    image_array[i + 2] = pixel_average;
  }
}

fn op_test_sync(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  if !zero_copy.is_empty() {
    println!("Hello from plugin.");
  }
  let zero_copy = zero_copy.to_vec();
  for (idx, buf) in zero_copy.iter().enumerate() {
    let buf_str = std::str::from_utf8(&buf[..]).unwrap();
    println!("zero_copy[{}]: {}", idx, buf_str);
  }
  let result = b"test";
  let result_box: Box<[u8]> = Box::new(*result);
  Op::Sync(result_box)
}

fn op_test_async(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  if !zero_copy.is_empty() {
    println!("Hello from plugin.");
  }
  let zero_copy = zero_copy.to_vec();
  let fut = async move {
    for (idx, buf) in zero_copy.iter().enumerate() {
      let buf_str = std::str::from_utf8(&buf[..]).unwrap();
      println!("zero_copy[{}]: {}", idx, buf_str);
    }
    let (tx, rx) = futures::channel::oneshot::channel::<Result<(), ()>>();
    std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_secs(1));
      tx.send(Ok(())).unwrap();
    });
    assert!(rx.await.is_ok());
    let result = b"test";
    let result_box: Box<[u8]> = Box::new(*result);
    result_box
  };

  Op::Async(fut.boxed())
}
