//! Box plugin ABI v1.
//!
//! Plugin processes communicate with the Box host over JSON-RPC 2.0 via
//! stdio. This crate defines the wire types and trait shapes; transport
//! lives in `box-core`.
//!
//! See `../../SPEC.md` for the language and `../../specs/` for the
//! plugin-protocol and plugin-abi specs.

/// ABI version reported in the plugin handshake.
pub const ABI_VERSION: u32 = 1;
