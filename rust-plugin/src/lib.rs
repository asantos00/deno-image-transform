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

  interface.register_op("testSync", op_test_sync);
  interface.register_op("testAsync", op_test_async);
  interface.register_op("toGreyScale", op_to_grey_scale);
}

fn hello_world(
  _interface: &mut dyn Interface,
  _zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  println!("Hello from rust.");

  Op::Sync(Box::new([]))
}

fn op_test_text_params_and_return(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  for (idx, buf) in zero_copy.iter().enumerate() {
    let param_str = std::str::from_utf8(&buf[..]).unwrap();

    println!("param[{}]: {}", idx, param_str);
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

  println!("json param: {}", json);

  let result = serde_json::json!({
    "someValue": 1
  });
  Op::Sync(serde_json::to_vec(&result).unwrap().into_boxed_slice())
}

fn op_to_grey_scale(
  _interface: &mut dyn Interface,
  zero_copy: &mut [ZeroCopyBuf],
) -> Op {
  let arg0 = &mut zero_copy[0];
  let image_array: &mut[u8] = arg0.as_mut();

  to_grey_scale(image_array);

  Op::Sync(Box::new([]))
}

const PIXEL_SIZE: usize = 4;

fn to_grey_scale(image_array: &mut[u8]) {
  let image_array_length = image_array.len() - (image_array.len() % PIXEL_SIZE);

  for i in (0..image_array_length).step_by(PIXEL_SIZE) {
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
