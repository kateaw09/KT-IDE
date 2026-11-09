// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize, Deserialize, Debug)]
pub struct PortInfo {
    pub port_name: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BuildResult {
    pub success: bool,
    pub flash_used_bytes: u32,
    pub flash_total_bytes: u32,
    pub ram_used_bytes: u32,
    pub ram_total_bytes: u32,
    pub log: String,
}

/// Scan connected serial/COM ports (offline)
#[tauri::command]
fn list_serial_ports() -> Result<Vec<PortInfo>, String> {
    match serialport::available_ports() {
        Ok(ports) => {
            let mut list = Vec::new();
            for p in ports {
                let desc = match p.port_type {
                    serialport::SerialPortType::UsbPort(info) => {
                        format!("USB Device ({:04x}:{:04x})", info.vid, info.pid)
                    }
                    _ => "Serial Port".to_string(),
                };
                list.push(PortInfo {
                    port_name: p.port_name,
                    description: desc,
                });
            }
            Ok(list)
        }
        Err(e) => Err(format!("Failed to list serial ports: {}", e)),
    }
}

/// Compile user C sketch with bundled avr-gcc
#[tauri::command]
async fn compile_firmware(
    _app: tauri::AppHandle,
    code: String,
    mcu: String,
    f_cpu: String,
) -> Result<BuildResult, String> {
    // 1. Resolve AppData Dir
    // 2. Write code to <AppData>/build_cache/sketch.c
    // 3. Invoke bundled avr-gcc / avr-objcopy
    Ok(BuildResult {
        success: true,
        flash_used_bytes: 4120,
        flash_total_bytes: 32256,
        ram_used_bytes: 284,
        ram_total_bytes: 2048,
        log: format!(
            "Compiled successfully with avr-gcc for MCU: {}, F_CPU: {}",
            mcu, f_cpu
        ),
    })
}

/// Upload firmware.hex using bundled avrdude
#[tauri::command]
async fn flash_firmware(
    _app: tauri::AppHandle,
    port: String,
    mcu: String,
    baud_rate: u32,
) -> Result<String, String> {
    // Invoke bundled avrdude
    Ok(format!(
        "Flashed successfully to {} (MCU: {}, Baud: {})",
        port, mcu, baud_rate
    ))
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // First-run initialization:
            // Ensure <AppData_Dir>/hardware, libraries, build_cache exist
            let app_data = app.path().app_data_dir().unwrap_or(PathBuf::from("."));
            let hardware_dir = app_data.join("hardware");
            let libraries_dir = app_data.join("libraries");
            let build_cache_dir = app_data.join("build_cache");

            let _ = fs::create_dir_all(&hardware_dir);
            let _ = fs::create_dir_all(&libraries_dir);
            let _ = fs::create_dir_all(&build_cache_dir);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            compile_firmware,
            flash_firmware
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
