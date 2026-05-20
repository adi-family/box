/**
 * Tree-sitter grammar for the Box language.
 *
 * Box is a TypeSpec-derived schema and project-definition language with
 * Compose/Flutter-style declarative blocks: `kind("name") { ... }`.
 * See ../../SPEC.md for the language spec.
 *
 * @file Box grammar definition
 * @author ADI Family
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'box',

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._top_level),

    _top_level: ($) =>
      choice(
        $.use_statement,
        $.import_statement,
        $.export_statement,
        $.kind_block,
        $.model_declaration,
        $.enum_declaration,
        $.type_alias,
      ),

    // ---------- Prelude statements ----------

    use_statement: ($) =>
      seq('use', field('package', $.string), optional($._as_alias)),

    import_statement: ($) =>
      seq('import', field('path', $.string), optional($._as_alias)),

    export_statement: ($) =>
      seq('export', field('path', $.string), optional($._as_alias)),

    _as_alias: ($) => seq('as', field('alias', $.identifier)),

    // ---------- Kind blocks ----------

    kind_block: ($) =>
      seq(
        field('kind', $.identifier),
        optional(seq('(', field('name', $.string), ')')),
        field('body', $.block_body),
      ),

    block_body: ($) => seq('{', repeat($._body_item), '}'),

    _body_item: ($) => choice($.field_assignment, $.child_block),

    child_block: ($) =>
      seq(
        field('kind', $.identifier),
        optional(seq('(', field('name', $.string), ')')),
        field('body', $.block_body),
      ),

    field_assignment: ($) =>
      seq(field('name', $.identifier), '=', field('value', $._value)),

    // ---------- Values ----------

    _value: ($) =>
      choice(
        $.string,
        $.number,
        $.boolean,
        $.null,
        $.array,
        $.function_call,
        $.operation_signature,
        $.dotted_path,
        $.identifier,
      ),

    array: ($) =>
      seq('[', optional(commaSep1($._value)), optional(','), ']'),

    function_call: ($) =>
      seq(
        field('name', $.identifier),
        '(',
        optional(commaSep1(choice($.named_argument, $._value))),
        optional(','),
        ')',
      ),

    named_argument: ($) =>
      seq(field('name', $.identifier), '=', field('value', $._value)),

    operation_signature: ($) =>
      seq(
        field('op_name', $.identifier),
        '(',
        optional(commaSep1($.op_parameter)),
        optional(','),
        ')',
        ':',
        field('return_type', $._type),
      ),

    op_parameter: ($) =>
      seq(
        field('name', $.identifier),
        ':',
        field('type', $._type),
      ),

    dotted_path: ($) => prec(2, seq($.identifier, repeat1(seq('.', $.identifier)))),

    // ---------- Declarations (TypeSpec-inherited) ----------

    model_declaration: ($) =>
      seq(
        'model',
        field('name', $.identifier),
        '{',
        repeat($.model_field),
        '}',
      ),

    model_field: ($) =>
      seq(
        optional($.decorator),
        field('name', $.identifier),
        optional('?'),
        ':',
        field('type', $._type),
      ),

    decorator: ($) =>
      seq(
        '@',
        $.identifier,
        optional(seq('(', optional(commaSep1($._value)), ')')),
      ),

    enum_declaration: ($) =>
      seq(
        'enum',
        field('name', $.identifier),
        '{',
        optional(commaSep1($.identifier)),
        optional(','),
        '}',
      ),

    type_alias: ($) =>
      seq('alias', field('name', $.identifier), '=', field('type', $._type)),

    // ---------- Types ----------

    _type: ($) => choice($.type_ref, $.array_type),

    type_ref: ($) =>
      seq(
        $.identifier,
        repeat(seq('.', $.identifier)),
      ),

    array_type: ($) => seq($._type, '[', ']'),

    // ---------- Lexemes ----------

    identifier: ($) => /[A-Za-z_][A-Za-z0-9_-]*/,

    string: ($) => seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),

    number: ($) => /-?\d+(\.\d+)?/,

    boolean: ($) => choice('true', 'false'),

    null: ($) => 'null',

    line_comment: ($) => token(seq('//', /.*/)),

    block_comment: ($) =>
      token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
