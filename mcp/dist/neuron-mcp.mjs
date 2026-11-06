// Built by scripts/build-mcp.ts. Do not edit; edit mcp/server.ts and rebuild.
import { createRequire as __cr } from 'node:module'; import { fileURLToPath as __fu } from 'node:url'; import __p from 'node:path';
const require = __cr(import.meta.url);
process.env.NEURON_DATA_DIR ||= __p.join(__p.dirname(__fu(import.meta.url)), '..', '..', 'data');
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks2 = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks2.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// node_modules/drizzle-orm/version.js
var version = "0.45.4";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks2, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks2.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str2) {
    return new SQL([new StringChunk(str2)]);
  }
  sql2.raw = raw;
  function join(chunks2, separator) {
    const result = [];
    for (const [i, chunk] of chunks2.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path: path2, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path2.entries()) {
        if (pathChunkIndex < path2.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path2.length === 2) {
            const objectName = path2[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};

// node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey2;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey2) {
            tableConfig.primaryKey.push(...primaryKey2);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey: primaryKey2
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// lib/db/index.ts
import Database from "better-sqlite3";

// node_modules/drizzle-orm/better-sqlite3/driver.js
import Client from "better-sqlite3";

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder2 = class {
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks2 = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks2.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder2 = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder = class extends ColumnBuilder {
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var SQLiteColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
};

// node_modules/drizzle-orm/sqlite-core/columns/blob.js
var SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
};
var SQLiteBigInt = class extends SQLiteColumn {
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf2 = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf2.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
};
var SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
};
var SQLiteBlobJson = class extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf2 = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf2.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
};
var SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
};
var SQLiteBlobBuffer = class extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
};
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}

// node_modules/drizzle-orm/sqlite-core/columns/custom.js
var SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
};
var SQLiteCustomColumn = class extends SQLiteColumn {
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}

// node_modules/drizzle-orm/sqlite-core/columns/integer.js
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
var SQLiteBaseInteger = class extends SQLiteColumn {
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
var SQLiteInteger = class extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteInteger";
};
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
var SQLiteBoolean = class extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}

// node_modules/drizzle-orm/sqlite-core/columns/numeric.js
var SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
};
var SQLiteNumeric = class extends SQLiteColumn {
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
};
var SQLiteNumericNumber = class extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
};
var SQLiteNumericBigInt = class extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

// node_modules/drizzle-orm/sqlite-core/columns/real.js
var SQLiteRealBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
};
var SQLiteReal = class extends SQLiteColumn {
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
};
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

// node_modules/drizzle-orm/sqlite-core/columns/text.js
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
};
var SQLiteText = class extends SQLiteColumn {
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
var SQLiteTextJson = class extends SQLiteColumn {
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

// node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}

// node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys2 = /* @__PURE__ */ Symbol.for("drizzle:SQLiteInlineForeignKeys");
var SQLiteTable = class extends Table {
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys2
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};

// node_modules/drizzle-orm/sqlite-core/primary-keys.js
function primaryKey(...config) {
  if (config[0].columns) {
    return new PrimaryKeyBuilder2(config[0].columns, config[0].name);
  }
  return new PrimaryKeyBuilder2(config);
}
var PrimaryKeyBuilder2 = class {
  static [entityKind] = "SQLitePrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey2(table, this.columns, this.name);
  }
};
var PrimaryKey2 = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "SQLitePrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[SQLiteTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/sqlite-core/utils.js
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}

// node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase = class extends View {
  static [entityKind] = "SQLiteViewBase";
};

// node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect = class {
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str2) {
    return `'${str2.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({
    table,
    where,
    returning,
    withList,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(
      columnNames.flatMap((colName, i) => {
        const col = tableColumns[colName];
        const onUpdateFnResult = col.onUpdateFn?.();
        const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
        const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
        if (i < setSize - 1) {
          return [res, sql.raw(", ")];
        }
        return [res];
      })
    );
  }
  buildUpdateQuery({
    table,
    set,
    where,
    returning,
    withList,
    joins,
    from,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks2 = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(
              sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(
              sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`
            );
          }
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: (v) => entry.mapFromDriverValue(v) } : entry.sql.decoder;
          if (fieldDecoder) field._.sql.decoder = fieldDecoder;
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks2);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(
              origTableName
            )}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(
        table[Table.Symbol.OriginalName]
      )} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join(
            "->"
          )}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(
                this.casing.getColumnCasing(chunk)
              );
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({
    table,
    values: valuesOrSelect,
    onConflict,
    returning,
    withList,
    select
  }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [
          key,
          aliasedTableColumn(value, tableAlias)
        ])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter(
            (key) => !selectedColumns.includes(key)
          );
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter(
          (entry) => !!entry[1]
        ).map(([tsKey, queryConfig]) => ({
          tsKey,
          queryConfig,
          relation: tableConfig.relations[tsKey]
        }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(
          schema,
          tableNamesMap,
          relation
        );
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(
                normalizedRelation.references[i],
                relationTableAlias
              ),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [
        {
          dbKey: "data",
          tsKey: "data",
          field: field.as("data"),
          isJson: true,
          relationTableTsKey: tableConfig.tsName,
          selection
        }
      ];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
var SQLiteSyncDialect = class extends SQLiteDialect {
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
var SQLiteAsyncDialect = class extends SQLiteDialect {
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/select.js
var SQLiteSelectBuilder = class {
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.all();
  }
};
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getSQLiteSetOperators = () => ({
  union,
  unionAll,
  intersect,
  except
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);

// node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var SQLiteInsertBase = class extends QueryPromise {
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
var SQLiteUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
  constructor(params) {
    super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = _SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder = class {
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var SQLiteRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw = class extends QueryPromise {
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase = class {
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync = class extends QueryPromise {
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
var SQLitePreparedQuery = class {
  constructor(mode, executeMethod, query, cache2, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache2;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache2 && cache2.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
var SQLiteSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
};

// node_modules/drizzle-orm/better-sqlite3/session.js
var BetterSQLiteSession = class extends SQLiteSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "BetterSQLiteSession";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    const stmt = this.client.prepare(query.sql);
    return new PreparedQuery(
      stmt,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  transaction(transaction, config = {}) {
    const tx = new BetterSQLiteTransaction("sync", this.dialect, this, this.schema);
    const nativeTx = this.client.transaction(transaction);
    return nativeTx[config.behavior ?? "deferred"](tx);
  }
};
var BetterSQLiteTransaction = class _BetterSQLiteTransaction extends SQLiteTransaction {
  static [entityKind] = "BetterSQLiteTransaction";
  transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _BetterSQLiteTransaction("sync", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = transaction(tx);
      this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
var PreparedQuery = class extends SQLitePreparedQuery {
  constructor(stmt, query, logger, cache2, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("sync", executeMethod, query, cache2, queryMetadata, cacheConfig);
    this.stmt = stmt;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "BetterSQLitePreparedQuery";
  run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.run(...params);
  }
  all(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return stmt.all(...params);
    }
    const rows = this.values(placeholderValues);
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
  }
  get(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    const { fields, stmt, joinsNotNullableMap, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      return stmt.get(...params);
    }
    const row = stmt.raw().get(...params);
    if (!row) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper([row]);
    }
    return mapResultRow(fields, row, joinsNotNullableMap);
  }
  values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.raw().all(...params);
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};

// node_modules/drizzle-orm/better-sqlite3/driver.js
var BetterSQLite3Database = class extends BaseSQLiteDatabase {
  static [entityKind] = "BetterSQLite3Database";
};
function construct(client, config = {}) {
  const dialect = new SQLiteSyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new BetterSQLiteSession(client, dialect, schema, { logger });
  const db2 = new BetterSQLite3Database("sync", dialect, session, schema);
  db2.$client = client;
  return db2;
}
function drizzle(...params) {
  if (params[0] === void 0 || typeof params[0] === "string") {
    const instance = params[0] === void 0 ? new Client() : new Client(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection === "object") {
      const { source, ...options } = connection;
      const instance2 = new Client(source, options);
      return construct(instance2, drizzleConfig);
    }
    const instance = new Client(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config) {
    return construct({}, config);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

// lib/db/index.ts
import fs from "node:fs";
import path from "node:path";

// lib/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  attempts: () => attempts,
  chats: () => chats,
  chunks: () => chunks,
  conceptDomains: () => conceptDomains,
  conceptSources: () => conceptSources,
  concepts: () => concepts,
  domains: () => domains,
  embeddings: () => embeddings,
  glossary: () => glossary,
  links: () => links,
  models: () => models,
  providers: () => providers,
  questions: () => questions,
  reviewCards: () => reviewCards,
  settings: () => settings,
  sources: () => sources,
  usageLog: () => usageLog,
  vocab: () => vocab,
  writings: () => writings
});
var now = () => Date.now();
var domains = sqliteTable("domains", {
  key: text("key").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameId: text("name_id").notNull(),
  colorIndex: integer("color_index").notNull().default(0)
});
var concepts = sqliteTable("concepts", {
  id: text("id").primaryKey(),
  labelEn: text("label_en").notNull(),
  labelId: text("label_id").notNull().default(""),
  summaryEn: text("summary_en").notNull().default(""),
  summaryId: text("summary_id").notNull().default(""),
  userDefinition: text("user_definition"),
  mastery: integer("mastery").notNull().default(0),
  misconception: integer("misconception", { mode: "boolean" }).notNull().default(false),
  auto: integer("auto", { mode: "boolean" }).notNull().default(false),
  originSourceId: integer("origin_source_id"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  updatedAt: integer("updated_at").notNull().$defaultFn(now)
});
var conceptDomains = sqliteTable(
  "concept_domains",
  {
    conceptId: text("concept_id").notNull(),
    domainKey: text("domain_key").notNull(),
    position: integer("position").notNull().default(0)
  },
  (t) => [primaryKey({ columns: [t.conceptId, t.domainKey] })]
);
var sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("text"),
  // text | note | pdf | docx | url | youtube
  urlOrPath: text("url_or_path"),
  text: text("text").notNull().default(""),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var chunks = sqliteTable("chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull(),
  idx: integer("idx").notNull(),
  page: integer("page"),
  text: text("text").notNull()
});
var conceptSources = sqliteTable("concept_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  sourceId: integer("source_id").notNull(),
  chunkId: integer("chunk_id"),
  note: text("note").notNull().default(""),
  quote: text("quote")
});
var links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  type: text("type").notNull(),
  // prerequisite | part_of | causes | contrasts | example_of | related
  status: text("status").notNull().default("suggested"),
  // suggested | approved
  whyEn: text("why_en"),
  whyId: text("why_id"),
  sourceId: integer("source_id"),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var vocab = sqliteTable("vocab", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  termEn: text("term_en").notNull(),
  termId: text("term_id").notNull(),
  example: text("example").notNull().default("")
});
var questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  kind: text("kind").notNull(),
  // mcq | essay
  payloadJson: text("payload_json").notNull(),
  bridgeConceptId: text("bridge_concept_id"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  questionId: integer("question_id"),
  kind: text("kind").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  score: integer("score"),
  confidence: text("confidence").notNull(),
  // guess | fair | sure
  masteryDelta: integer("mastery_delta").notNull(),
  answerText: text("answer_text"),
  feedbackJson: text("feedback_json"),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var glossary = sqliteTable("glossary", {
  term: text("term").primaryKey(),
  definition: text("definition").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: text("concept_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var reviewCards = sqliteTable("review_cards", {
  conceptId: text("concept_id").primaryKey(),
  fsrsStateJson: text("fsrs_state_json").notNull(),
  dueAt: integer("due_at").notNull()
});
var settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull()
});
var providers = sqliteTable("providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  // anthropic | openrouter | gemini | ollama | openai_compatible
  name: text("name").notNull(),
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: integer("provider_id").notNull(),
  modelId: text("model_id").notNull(),
  label: text("label").notNull(),
  inputPrice: real("input_price").notNull().default(0),
  // USD per 1M input tokens
  outputPrice: real("output_price").notNull().default(0),
  // USD per 1M output tokens
  contextWindow: integer("context_window"),
  maxOutput: integer("max_output").notNull().default(4096),
  purpose: text("purpose").notNull().default("chat"),
  // chat | embed
  notes: text("notes"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().$defaultFn(now)
});
var usageLog = sqliteTable("usage_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  providerId: integer("provider_id"),
  providerKind: text("provider_kind").notNull(),
  providerName: text("provider_name").notNull(),
  modelRowId: integer("model_row_id"),
  modelId: text("model_id").notNull(),
  feature: text("feature").notNull(),
  // import | vocab | mcq | essay_question | essay_grade | discuss | test
  depth: text("depth").notNull(),
  conceptId: text("concept_id"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  estimated: integer("estimated", { mode: "boolean" }).notNull().default(false),
  costUsd: real("cost_usd").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  status: text("status").notNull(),
  // ok | error | aborted
  error: text("error")
});
var embeddings = sqliteTable(
  "embeddings",
  {
    kind: text("kind").notNull(),
    refId: text("ref_id").notNull(),
    model: text("model").notNull(),
    hash: text("hash").notNull(),
    vector: blob("vector", { mode: "buffer" }).notNull(),
    updatedAt: integer("updated_at").notNull()
  },
  (t) => [primaryKey({ columns: [t.kind, t.refId] })]
);
var writings = sqliteTable("writings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull().default("writing"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  briefJson: text("brief_json").notNull().default("{}"),
  conceptIds: text("concept_ids").notNull().default("[]"),
  lang: text("lang"),
  postJson: text("post_json"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull()
});

// lib/seed-data.ts
var B = (en, id) => ({ en, id });
var O = (arr) => arr.map(([en, id]) => ({ en, id }));
var Q = (q, o, a, why, bridge) => ({ q, o: O(o), a, why, bridge: bridge || null });
var TOPICS0 = [
  { key: "tech", en: "Technology & programming", id: "Teknologi & pemrograman", c: 0 },
  { key: "science", en: "Science & nature", id: "Sains & alam", c: 1 },
  { key: "money", en: "Business & money", id: "Bisnis & keuangan", c: 2 },
  { key: "ideas", en: "History, philosophy & society", id: "Sejarah, filsafat & masyarakat", c: 3 }
];
var NODES0 = [
  {
    id: "algorithm",
    label: B("Algorithm", "Algoritma"),
    topics: ["tech"],
    mastery: 75,
    summary: B("A finite, step-by-step procedure that turns an input into an output. The same problem can have many algorithms that differ in speed and memory.", "Prosedur langkah demi langkah yang terbatas untuk mengubah masukan menjadi keluaran. Satu masalah bisa punya banyak algoritma yang berbeda kecepatan dan memorinya."),
    sources: [{ t: "Cormen et al., Introduction to Algorithms", n: "An algorithm is a well-defined procedure that takes input and produces output." }],
    vocab: [{ en: "input", id: "masukan", ex: "Daftar angka yang belum urut adalah masukan untuk algoritma pengurutan." }, { en: "step", id: "langkah", ex: "Setiap langkah harus jelas dan bisa dikerjakan." }],
    quiz: [Q(
      B("What makes something an algorithm rather than a vague plan?", "Apa yang membuat sesuatu disebut algoritma, bukan sekadar rencana kabur?"),
      [["It must run on a computer", "Harus dijalankan di komputer"], ["Its steps are precise and it finishes", "Langkahnya jelas dan pasti selesai"], ["It must be written in Python", "Harus ditulis dalam Python"], ["It must be fast", "Harus cepat"]],
      1,
      B("A recipe can be an algorithm. What matters is precise steps and a guaranteed end, not the machine or language.", "Resep masakan pun bisa jadi algoritma. Yang penting langkahnya jelas dan pasti berakhir, bukan mesin atau bahasanya.")
    )]
  },
  {
    id: "bigo",
    label: B("Big-O notation", "Notasi Big-O"),
    topics: ["tech"],
    mastery: 50,
    summary: B("A way to describe how an algorithm\u2019s running time or memory grows as the input grows, ignoring constants. O(n) grows in step with the input; O(n\xB2) grows with its square.", "Cara menggambarkan bagaimana waktu atau memori algoritma bertambah saat masukan membesar, tanpa memedulikan konstanta. O(n) tumbuh seiring masukan; O(n\xB2) tumbuh sebesar kuadratnya."),
    sources: [{ t: "Cormen et al., Introduction to Algorithms", n: "Asymptotic notation compares growth rates." }],
    vocab: [{ en: "time complexity", id: "kompleksitas waktu", ex: "Kompleksitas waktu pencarian biner adalah O(log n)." }, { en: "worst case", id: "kasus terburuk", ex: "Big-O biasanya menggambarkan kasus terburuk." }],
    quiz: [Q(
      B("A list grows from 1,000 to 2,000 items. Roughly how much longer does an O(n\xB2) algorithm take?", "Sebuah daftar bertambah dari 1.000 menjadi 2.000 item. Kira-kira berapa kali lebih lama algoritma O(n\xB2)?"),
      [["The same time", "Sama saja"], ["Twice as long", "Dua kali lebih lama"], ["Four times as long", "Empat kali lebih lama"], ["A thousand times as long", "Seribu kali lebih lama"]],
      2,
      B("Doubling n squares to four times the work: (2n)\xB2 = 4n\xB2.", "Menggandakan n membuat kerjanya empat kali: (2n)\xB2 = 4n\xB2.")
    )]
  },
  {
    id: "feedback",
    label: B("Feedback loop", "Umpan balik (feedback loop)"),
    topics: ["tech", "science", "money"],
    mastery: 45,
    summary: B("When a system\u2019s output feeds back into its input. Negative feedback stabilises (a thermostat); positive feedback amplifies (a microphone squeal, a bank run).", "Saat keluaran sebuah sistem kembali memengaruhi masukannya. Umpan balik negatif menstabilkan (termostat); umpan balik positif memperkuat (dengung mikrofon, rush bank)."),
    sources: [{ t: "Donella Meadows, Thinking in Systems (2008)", n: "Balancing loops seek a goal; reinforcing loops grow or collapse." }],
    vocab: [{ en: "reinforcing loop", id: "umpan balik penguat", ex: "Makin banyak pengguna, makin menarik aplikasinya: itu umpan balik penguat." }, { en: "balancing loop", id: "umpan balik penyeimbang", ex: "Termostat adalah umpan balik penyeimbang." }],
    quiz: [
      Q(
        B("Which is a negative (balancing) feedback loop?", "Mana yang termasuk umpan balik negatif (penyeimbang)?"),
        [["Sweating cools you when you get hot", "Berkeringat mendinginkan tubuh saat kepanasan"], ["A viral video gets recommended more the more it\u2019s watched", "Video viral makin direkomendasikan makin sering ditonton"], ["Panic selling pushes prices down, causing more panic", "Panic selling menurunkan harga dan memicu panik lagi"], ["Interest earning interest", "Bunga yang menghasilkan bunga"]],
        0,
        B("Negative feedback pushes back toward a set point. The others amplify themselves.", "Umpan balik negatif mendorong kembali ke titik seimbang. Pilihan lain memperkuat dirinya sendiri.")
      ),
      Q(
        B("Why does positive feedback tend to produce exponential growth?", "Kenapa umpan balik positif cenderung menghasilkan pertumbuhan eksponensial?"),
        [["Each step adds the same fixed amount", "Setiap langkah menambah jumlah tetap yang sama"], ["The more there is, the faster it grows", "Makin banyak jumlahnya, makin cepat tumbuhnya"], ["It always stops at a limit", "Selalu berhenti di satu batas"], ["It only happens in computers", "Hanya terjadi di komputer"]],
        1,
        B("Growth proportional to the current amount is the definition of exponential growth.", "Pertumbuhan yang sebanding dengan jumlah saat ini adalah definisi pertumbuhan eksponensial."),
        "exponential"
      )
    ]
  },
  {
    id: "exponential",
    label: B("Exponential growth", "Pertumbuhan eksponensial"),
    topics: ["science", "money"],
    mastery: 60,
    summary: B("Growth by a fixed percentage per period, so the amount keeps doubling in equal times. It looks slow at first and then explodes, which is why people underestimate it.", "Pertumbuhan dengan persentase tetap per periode, sehingga jumlahnya terus berlipat dua dalam waktu yang sama. Awalnya terlihat lambat lalu melonjak, karena itu orang sering meremehkannya."),
    sources: [{ t: "Albert Bartlett, Arithmetic, Population and Energy (lecture)", n: "\u201CThe greatest shortcoming of the human race is our inability to understand the exponential function.\u201D" }],
    vocab: [{ en: "doubling time", id: "waktu penggandaan", ex: "Dengan pertumbuhan 7% per tahun, waktu penggandaannya sekitar 10 tahun." }, { en: "growth rate", id: "laju pertumbuhan", ex: "Laju pertumbuhan bakteri bisa 100% per 20 menit." }],
    quiz: [Q(
      B("Lily pads double every day and cover the pond on day 30. When was the pond half covered?", "Teratai berlipat dua setiap hari dan menutupi kolam pada hari ke-30. Kapan kolam tertutup setengah?"),
      [["Day 15", "Hari ke-15"], ["Day 20", "Hari ke-20"], ["Day 29", "Hari ke-29"], ["Day 1", "Hari ke-1"]],
      2,
      B("Doubling means the last step is as big as everything before it: half on day 29, full on day 30.", "Berlipat dua berarti langkah terakhir sama besar dengan semua sebelumnya: setengah di hari 29, penuh di hari 30.")
    )]
  },
  {
    id: "compound",
    label: B("Compound interest", "Bunga majemuk"),
    topics: ["money"],
    mastery: 65,
    summary: B("Interest earned on both the original money and the interest already added. Over long periods time matters more than the starting amount.", "Bunga yang dihitung dari uang awal sekaligus bunga yang sudah ditambahkan. Dalam jangka panjang, lamanya waktu lebih berpengaruh daripada jumlah awal."),
    sources: [{ t: "Morgan Housel, The Psychology of Money (2020)", n: "Most of Warren Buffett\u2019s wealth came after his 60s: compounding needs time." }],
    vocab: [{ en: "principal", id: "pokok (modal awal)", ex: "Pokoknya Rp10 juta, bunganya 6% per tahun." }, { en: "compounding", id: "pemajemukan", ex: "Pemajemukan bekerja paling kuat dalam jangka panjang." }],
    quiz: [
      Q(
        B("Two people invest the same monthly amount at 7%. Ana starts at 22 and stops at 32; Budi starts at 32 and continues to 62. At 62, who likely has more?", "Dua orang menabung jumlah bulanan sama dengan bunga 7%. Ana mulai umur 22 dan berhenti di 32; Budi mulai umur 32 sampai 62. Di umur 62, siapa kemungkinan punya lebih banyak?"),
        [["Budi, he invested three times as long", "Budi, ia menabung tiga kali lebih lama"], ["Ana, her money compounded for 40 years", "Ana, uangnya berlipat selama 40 tahun"], ["They end up equal", "Hasilnya sama"], ["It\u2019s impossible to tell", "Tidak bisa diketahui"]],
        1,
        B("Ana\u2019s early money had 40 years to compound. Time in the market beats the size of later deposits.", "Uang awal Ana punya 40 tahun untuk berlipat. Lamanya waktu mengalahkan besarnya setoran belakangan.")
      ),
      Q(
        B("Compound interest is an example of which pattern?", "Bunga majemuk adalah contoh pola apa?"),
        [["Linear growth", "Pertumbuhan linear"], ["Exponential growth", "Pertumbuhan eksponensial"], ["Random walk", "Jalan acak"], ["Diminishing returns", "Hasil yang makin berkurang"]],
        1,
        B("A fixed percentage on a growing balance is exponential growth.", "Persentase tetap atas saldo yang terus bertambah adalah pertumbuhan eksponensial."),
        "exponential"
      )
    ]
  },
  {
    id: "entropy",
    label: B("Entropy", "Entropi"),
    topics: ["science", "tech"],
    mastery: 30,
    summary: B("In physics, a measure of how many ways a system can be arranged; isolated systems drift toward higher entropy. In information theory, the average surprise of a message, which sets a limit on how far it can be compressed.", "Dalam fisika, ukuran banyaknya cara sebuah sistem bisa tersusun; sistem tertutup cenderung menuju entropi lebih tinggi. Dalam teori informasi, rata-rata kejutan sebuah pesan, yang membatasi seberapa jauh pesan bisa dikompresi."),
    sources: [{ t: "Claude Shannon, A Mathematical Theory of Communication (1948)", n: "Information entropy measures uncertainty in bits." }],
    vocab: [{ en: "compression", id: "kompresi", ex: "File teks berulang mudah dikompresi karena entropinya rendah." }, { en: "disorder", id: "ketidakteraturan", ex: "Entropi sering disederhanakan sebagai ketidakteraturan." }],
    quiz: [Q(
      B("Which file will compress the most with ZIP?", "File mana yang paling banyak menyusut saat di-ZIP?"),
      [["A file of random bytes", "File berisi byte acak"], ["An already-compressed JPEG", "JPEG yang sudah terkompresi"], ["A text file that repeats one sentence 10,000 times", "File teks yang mengulang satu kalimat 10.000 kali"], ["An encrypted file", "File terenkripsi"]],
      2,
      B("Repetition means low entropy: little surprise, so few bits are needed. Random and encrypted data are high entropy.", "Pengulangan berarti entropi rendah: sedikit kejutan, jadi butuh sedikit bit. Data acak dan terenkripsi entropinya tinggi."),
      "algorithm"
    )]
  },
  {
    id: "natselection",
    label: B("Natural selection", "Seleksi alam"),
    topics: ["science"],
    mastery: 70,
    summary: B("Individuals with traits that help them survive and reproduce leave more offspring, so those traits become common over generations. It needs variation, inheritance and competition.", "Individu dengan sifat yang membantu bertahan hidup dan berkembang biak meninggalkan lebih banyak keturunan, sehingga sifat itu makin umum dari generasi ke generasi. Syaratnya ada variasi, pewarisan, dan persaingan."),
    sources: [{ t: "Charles Darwin, On the Origin of Species (1859)", n: "Darwin credited Malthus: populations grow faster than food supplies." }],
    vocab: [{ en: "adaptation", id: "adaptasi", ex: "Paruh burung finch adalah contoh adaptasi." }, { en: "heritable", id: "dapat diwariskan", ex: "Sifat harus dapat diwariskan agar bisa diseleksi." }],
    quiz: [Q(
      B("Bacteria become resistant to an antibiotic. What happened?", "Bakteri menjadi kebal terhadap antibiotik. Apa yang terjadi?"),
      [["Each bacterium learned to resist", "Setiap bakteri belajar melawan"], ["Resistant ones survived and multiplied", "Yang kebal bertahan lalu berkembang biak"], ["The antibiotic changed the bacteria on purpose", "Antibiotik sengaja mengubah bakteri"], ["They became resistant to please the host", "Mereka kebal demi inangnya"]],
      1,
      B("Selection acts on existing variation: the antibiotic removes the weak, the resistant multiply.", "Seleksi bekerja pada variasi yang sudah ada: antibiotik menyingkirkan yang lemah, yang kebal berkembang biak.")
    )]
  },
  {
    id: "falsifiability",
    label: B("Falsifiability", "Falsifiabilitas"),
    topics: ["science", "ideas"],
    mastery: 40,
    summary: B("Karl Popper\u2019s test for a scientific claim: it must say what observation would prove it wrong. \u201CAll swans are white\u201D is falsifiable; a claim that fits every possible outcome is not.", "Ujian Karl Popper untuk klaim ilmiah: klaim itu harus menyebutkan pengamatan apa yang akan membuktikannya salah. \u201CSemua angsa putih\u201D bisa difalsifikasi; klaim yang cocok dengan semua kemungkinan tidak bisa."),
    sources: [{ t: "Karl Popper, The Logic of Scientific Discovery (1959)", n: "A theory that explains everything explains nothing." }],
    vocab: [{ en: "hypothesis", id: "hipotesis", ex: "Hipotesis yang baik bisa diuji dan bisa gagal." }, { en: "refute", id: "membantah", ex: "Satu angsa hitam cukup untuk membantah klaim itu." }],
    quiz: [Q(
      B("Which claim is NOT falsifiable?", "Klaim mana yang TIDAK bisa difalsifikasi?"),
      [["Water boils at 100 \xB0C at sea level", "Air mendidih pada 100 \xB0C di permukaan laut"], ["This app loads in under 2 seconds on 4G", "Aplikasi ini terbuka di bawah 2 detik di 4G"], ["Everything happens for a reason we can\u2019t know", "Segala sesuatu terjadi karena alasan yang tak bisa kita ketahui"], ["Prices rise when the money supply grows fast", "Harga naik saat jumlah uang beredar tumbuh cepat"]],
      2,
      B("No observation could ever count against it, so it can\u2019t be tested.", "Tidak ada pengamatan yang bisa membantahnya, jadi tidak bisa diuji.")
    )]
  },
  {
    id: "occam",
    label: B("Occam\u2019s razor", "Pisau Ockham"),
    topics: ["ideas", "tech"],
    mastery: 55,
    summary: B("When two explanations fit the facts equally well, prefer the one with fewer assumptions. A rule of thumb, not a proof: the simpler one can still be wrong.", "Jika dua penjelasan sama-sama cocok dengan fakta, pilih yang asumsinya lebih sedikit. Ini aturan praktis, bukan bukti: yang lebih sederhana tetap bisa salah."),
    sources: [{ t: "William of Ockham (14th century), as later summarised", n: "Entities should not be multiplied beyond necessity." }],
    vocab: [{ en: "assumption", id: "asumsi", ex: "Setiap asumsi tambahan adalah peluang untuk salah." }, { en: "parsimony", id: "kesederhanaan (parsimoni)", ex: "Parsimoni adalah nama lain prinsip ini." }],
    quiz: [Q(
      B("Your app crashed right after you changed one line. What does Occam\u2019s razor suggest checking first?", "Aplikasimu crash tepat setelah kamu mengubah satu baris. Menurut pisau Ockham, apa yang dicek dulu?"),
      [["A cosmic ray flipped a bit", "Sinar kosmik membalik satu bit"], ["The line you just changed", "Baris yang baru saja kamu ubah"], ["A bug in the operating system", "Bug di sistem operasi"], ["Someone hacked the server", "Ada yang meretas server"]],
      1,
      B("The recent change explains the crash with the fewest extra assumptions.", "Perubahan terakhir menjelaskan crash dengan asumsi tambahan paling sedikit.")
    )]
  },
  {
    id: "overfitting",
    label: B("Overfitting", "Overfitting"),
    topics: ["tech", "science"],
    mastery: 35,
    summary: B("When a model learns the noise in its training data instead of the real pattern, so it scores well on data it has seen and badly on new data. Simpler models and testing on held-out data guard against it.", "Saat model mempelajari derau pada data latih alih-alih pola sebenarnya, sehingga nilainya bagus di data yang sudah dilihat tapi buruk di data baru. Model yang lebih sederhana dan pengujian dengan data terpisah mencegahnya."),
    sources: [{ t: "Brian Christian & Tom Griffiths, Algorithms to Live By (2016)", n: "Chapter \u201COverfitting: When to think less\u201D." }],
    vocab: [{ en: "training data", id: "data latih", ex: "Model dilatih dengan data latih, lalu diuji dengan data uji." }, { en: "generalise", id: "menggeneralisasi", ex: "Model yang baik mampu menggeneralisasi ke data baru." }],
    quiz: [
      Q(
        B("A model is 99% accurate on training data and 60% on new data. What\u2019s the likely problem?", "Model akurat 99% di data latih dan 60% di data baru. Apa kemungkinan masalahnya?"),
        [["Underfitting", "Underfitting"], ["Overfitting", "Overfitting"], ["Too little memory", "Memori kurang"], ["The new data is wrong", "Data barunya salah"]],
        1,
        B("A big gap between seen and unseen data is the signature of overfitting.", "Selisih besar antara data yang sudah dilihat dan data baru adalah ciri overfitting.")
      ),
      Q(
        B("How does Occam\u2019s razor relate to overfitting?", "Apa hubungan pisau Ockham dengan overfitting?"),
        [["It causes overfitting", "Menyebabkan overfitting"], ["Preferring simpler models is a guard against it", "Memilih model yang lebih sederhana mencegahnya"], ["They are unrelated", "Tidak berhubungan"], ["It says always use the biggest model", "Menyuruh selalu pakai model terbesar"]],
        1,
        B("Fewer parameters leave less room to memorise noise.", "Parameter yang lebih sedikit menyisakan sedikit ruang untuk menghafal derau."),
        "occam"
      )
    ]
  },
  {
    id: "oppcost",
    label: B("Opportunity cost", "Biaya peluang"),
    topics: ["money", "ideas"],
    mastery: 60,
    summary: B("The value of the best option you give up when you choose something. Time spent scrolling costs whatever else you could have done with it.", "Nilai pilihan terbaik yang kamu korbankan saat memilih sesuatu. Waktu untuk scroll berbiaya sebesar hal lain yang bisa kamu kerjakan."),
    sources: [{ t: "N. Gregory Mankiw, Principles of Economics", n: "The cost of something is what you give up to get it." }],
    vocab: [{ en: "trade-off", id: "pertukaran (trade-off)", ex: "Memilih kuliah S2 berarti trade-off dengan gaji dua tahun." }, { en: "forgone", id: "yang dikorbankan", ex: "Gaji yang dikorbankan termasuk biaya kuliah." }],
    quiz: [Q(
      B("You turn down a Rp6 million freelance job to attend a free bootcamp. What is the bootcamp\u2019s opportunity cost?", "Kamu menolak proyek freelance Rp6 juta untuk ikut bootcamp gratis. Berapa biaya peluang bootcamp itu?"),
      [["Nothing, it was free", "Nol, karena gratis"], ["Rp6 million, the income you gave up", "Rp6 juta, pendapatan yang kamu lepas"], ["Only the transport", "Hanya ongkos transport"], ["The bootcamp\u2019s price elsewhere", "Harga bootcamp di tempat lain"]],
      1,
      B("Free to enter is not free: the best alternative you gave up is the cost.", "Gratis bukan berarti tanpa biaya: alternatif terbaik yang dilepas adalah biayanya.")
    )]
  },
  {
    id: "network",
    label: B("Network effect", "Efek jaringan"),
    topics: ["money", "tech"],
    mastery: 50,
    summary: B("A product gets more valuable as more people use it, like messaging apps or marketplaces. It creates winner-take-most markets and makes switching hard.", "Produk makin bernilai saat makin banyak orang memakainya, seperti aplikasi chat atau marketplace. Ini menciptakan pasar yang dikuasai pemenang dan membuat orang sulit pindah."),
    sources: [{ t: "Carl Shapiro & Hal Varian, Information Rules (1999)", n: "Positive feedback makes the strong get stronger." }],
    vocab: [{ en: "lock-in", id: "ketergantungan (lock-in)", ex: "Grup keluarga di WhatsApp menciptakan lock-in." }, { en: "critical mass", id: "massa kritis", ex: "Marketplace butuh massa kritis penjual dan pembeli." }],
    quiz: [Q(
      B("Why is it hard for a new chat app to beat WhatsApp in Indonesia, even with better features?", "Kenapa aplikasi chat baru sulit mengalahkan WhatsApp di Indonesia, walau fiturnya lebih bagus?"),
      [["Better features never matter", "Fitur bagus tidak pernah penting"], ["Its value depends on your contacts already being there", "Nilainya bergantung pada kontakmu yang sudah ada di sana"], ["It is illegal to switch", "Pindah aplikasi dilarang"], ["Phones only allow one chat app", "Ponsel hanya bisa satu aplikasi chat"]],
      1,
      B("The value is the network, not the features. That\u2019s a reinforcing feedback loop.", "Nilainya ada di jaringan, bukan fitur. Itu umpan balik penguat."),
      "feedback"
    )]
  },
  {
    id: "printing",
    label: B("Printing press", "Mesin cetak"),
    topics: ["ideas", "tech"],
    mastery: 45,
    summary: B("Gutenberg\u2019s movable-type press (around 1450) made books cheap and identical, spreading ideas fast. Historians link it to the Reformation and the Scientific Revolution, much as the internet reshaped information later.", "Mesin cetak huruf lepas Gutenberg (sekitar 1450) membuat buku murah dan seragam, sehingga ide menyebar cepat. Sejarawan mengaitkannya dengan Reformasi dan Revolusi Ilmiah, mirip cara internet mengubah informasi kemudian."),
    sources: [{ t: "Elizabeth Eisenstein, The Printing Press as an Agent of Change (1979)", n: "Standardised copies let scholars build on each other\u2019s work." }],
    vocab: [{ en: "movable type", id: "huruf lepas", ex: "Huruf lepas bisa disusun ulang untuk halaman baru." }, { en: "literacy", id: "literasi (melek huruf)", ex: "Buku murah mendorong literasi." }],
    quiz: [Q(
      B("Why did identical printed copies matter for science?", "Kenapa salinan cetak yang identik penting bagi sains?"),
      [["Printed books were prettier", "Buku cetak lebih indah"], ["Scholars far apart could check and build on the same data", "Ilmuwan yang berjauhan bisa memeriksa dan membangun dari data yang sama"], ["Kings could ban books more easily", "Raja lebih mudah melarang buku"], ["Handwriting was illegal", "Tulisan tangan dilarang"]],
      1,
      B("Hand copies drifted with errors; printing made shared, checkable records possible.", "Salinan tangan menumpuk kesalahan; cetakan memungkinkan catatan bersama yang bisa diperiksa."),
      "falsifiability"
    )]
  },
  {
    id: "survivorship",
    label: B("Survivorship bias", "Bias penyintas"),
    topics: ["ideas", "money", "science"],
    mastery: 40,
    summary: B("Drawing conclusions only from the cases that made it through, while the failures are invisible. In WWII, Abraham Wald advised armouring the planes where returning bombers had no holes: hits there were the ones that brought planes down.", "Menarik kesimpulan hanya dari yang berhasil lolos, sementara yang gagal tidak terlihat. Pada Perang Dunia II, Abraham Wald menyarankan melapisi bagian pesawat yang justru tidak berlubang: tembakan di sana yang membuat pesawat jatuh."),
    sources: [{ t: "Abraham Wald, Statistical Research Group (1943)", n: "Look at the planes that didn\u2019t come back." }],
    vocab: [{ en: "sample", id: "sampel", ex: "Sampel yang hanya berisi pemenang itu bias." }, { en: "dropout", id: "yang gugur", ex: "Startup yang gugur jarang diwawancarai." }],
    quiz: [
      Q(
        B("\u201CMany famous founders dropped out of college, so dropping out helps you succeed.\u201D What\u2019s wrong?", "\u201CBanyak pendiri terkenal putus kuliah, jadi putus kuliah membantu sukses.\u201D Apa yang salah?"),
        [["Nothing, the examples prove it", "Tidak ada, contohnya membuktikan"], ["We don\u2019t see the many dropouts who failed", "Kita tidak melihat banyak orang putus kuliah yang gagal"], ["Founders never drop out", "Pendiri tidak pernah putus kuliah"], ["College always guarantees success", "Kuliah selalu menjamin sukses"]],
        1,
        B("The failures are missing from the sample, so the pattern is an illusion.", "Yang gagal tidak masuk sampel, jadi polanya hanya ilusi.")
      ),
      Q(
        B("How is survivorship bias like overfitting?", "Apa kemiripan bias penyintas dengan overfitting?"),
        [["Both learn from a sample that doesn\u2019t represent new cases", "Keduanya belajar dari sampel yang tidak mewakili kasus baru"], ["Both are about airplanes", "Keduanya soal pesawat"], ["Both make models faster", "Keduanya membuat model lebih cepat"], ["They are opposites", "Keduanya berlawanan"]],
        0,
        B("Both mistake patterns in a skewed sample for rules that hold outside it.", "Keduanya mengira pola di sampel yang miring adalah aturan yang berlaku di luar sampel."),
        "overfitting"
      )
    ]
  },
  {
    id: "commons",
    label: B("Tragedy of the commons", "Tragedi milik bersama"),
    topics: ["ideas", "money", "science"],
    mastery: 35,
    summary: B("When a shared resource is open to all, each person gains by taking a bit more, so together they can use it up: overfishing, traffic, a shared server. Elinor Ostrom showed communities can manage commons well with clear local rules.", "Saat sumber daya bersama terbuka untuk semua, tiap orang untung dengan mengambil sedikit lebih banyak, sehingga bersama-sama bisa menghabiskannya: penangkapan ikan berlebih, macet, server bersama. Elinor Ostrom menunjukkan komunitas bisa mengelolanya dengan aturan lokal yang jelas."),
    sources: [{ t: "Garrett Hardin, The Tragedy of the Commons, Science (1968)", n: "Freedom in a commons brings ruin to all." }, { t: "Elinor Ostrom, Governing the Commons (1990)", n: "Communities often manage commons without privatisation or the state." }],
    vocab: [{ en: "shared resource", id: "sumber daya bersama", ex: "Wi-Fi kampus adalah sumber daya bersama." }, { en: "free rider", id: "penumpang gelap (free rider)", ex: "Free rider menikmati hasil tanpa ikut menanggung biaya." }],
    quiz: [Q(
      B("What did Elinor Ostrom find about commons?", "Apa temuan Elinor Ostrom tentang milik bersama?"),
      [["They always end in ruin", "Selalu berakhir hancur"], ["Only privatisation can save them", "Hanya privatisasi yang bisa menyelamatkan"], ["Communities often manage them well with clear local rules", "Komunitas sering bisa mengelolanya dengan aturan lokal yang jelas"], ["Governments must own everything", "Pemerintah harus memiliki semuanya"]],
      2,
      B("Her Nobel-winning work showed the tragedy isn\u2019t inevitable.", "Penelitiannya yang meraih Nobel menunjukkan tragedi itu tidak pasti terjadi.")
    )]
  }
];
var LINKS0 = [
  ["bigo", "algorithm", "part_of"],
  ["entropy", "algorithm", "related"],
  ["occam", "overfitting", "related"],
  ["compound", "exponential", "example_of"],
  ["feedback", "exponential", "causes"],
  ["network", "feedback", "example_of"],
  ["exponential", "natselection", "related"],
  ["falsifiability", "occam", "related"],
  ["survivorship", "overfitting", "related"],
  ["oppcost", "compound", "related"],
  ["printing", "falsifiability", "related"],
  ["printing", "network", "related"],
  ["commons", "feedback", "related"],
  ["commons", "oppcost", "related"]
].map(([s, t, type]) => ({ source: s, target: t, type, status: "approved", why: null }));
var SAMPLE_TITLE = "Why doubling fools us (sample article)";
var OFFLINE = {
  nodes: [
    {
      id: "rule72",
      label: B("Rule of 72", "Aturan 72"),
      topics: ["money", "science"],
      mastery: 0,
      auto: true,
      origin: SAMPLE_TITLE,
      summary: B("A quick estimate of doubling time: divide 72 by the growth rate in percent. At 6% a year, money doubles in about 12 years.", "Perkiraan cepat waktu penggandaan: bagi 72 dengan laju pertumbuhan dalam persen. Dengan 6% per tahun, uang berlipat dua dalam sekitar 12 tahun."),
      sources: [{ t: SAMPLE_TITLE, n: "At 9%, money doubles in about 8 years." }],
      vocab: [{ en: "rule of thumb", id: "aturan praktis", ex: "Aturan 72 adalah aturan praktis, bukan rumus pasti." }],
      quiz: []
    },
    {
      id: "logistic",
      label: B("S-curve (logistic growth)", "Kurva S (pertumbuhan logistik)"),
      topics: ["science", "money"],
      mastery: 0,
      auto: true,
      origin: SAMPLE_TITLE,
      summary: B("Growth that starts exponential and then slows as it meets a limit such as food, space or customers, giving an S shape.", "Pertumbuhan yang awalnya eksponensial lalu melambat saat bertemu batas seperti makanan, ruang, atau pelanggan, sehingga berbentuk huruf S."),
      sources: [{ t: SAMPLE_TITLE, n: "Growth bends into an S-shaped curve as it meets its limit." }],
      vocab: [{ en: "carrying capacity", id: "daya dukung", ex: "Daya dukung kolam membatasi jumlah ikan." }],
      quiz: []
    }
  ],
  merge: { id: "exponential", source: { t: SAMPLE_TITLE, n: "Each doubling adds as much as all the growth before it." } },
  links: [
    { source: "rule72", target: "exponential", type: "part_of", status: "suggested", why: { en: "The rule of 72 estimates the doubling time of exponential growth." } },
    { source: "rule72", target: "compound", type: "related", status: "suggested", why: { en: "The article uses it to estimate how fast savings double." } },
    { source: "logistic", target: "exponential", type: "contrasts", status: "suggested", why: { en: "An S-curve is what exponential growth becomes when it meets a limit." } },
    { source: "logistic", target: "natselection", type: "related", status: "suggested", why: { en: "Limits on food and space are what create competition in natural selection." } }
  ]
};

// lib/db/seed.ts
var GRAPH_TABLES = [
  "domains",
  "concepts",
  "concept_domains",
  "sources",
  "chunks",
  "concept_sources",
  "links",
  "vocab",
  "questions",
  "attempts",
  "glossary",
  "chats",
  "review_cards",
  "embeddings"
];
function seedDemo(db2) {
  const s = db2.$client;
  const tx = s.transaction(() => {
    for (const t of GRAPH_TABLES) s.prepare(`DELETE FROM ${t}`).run();
    s.prepare("DELETE FROM settings WHERE key IN ('last_import','demo_offline')").run();
    const now3 = Date.now();
    for (const t of TOPICS0) {
      db2.insert(domains).values({ key: t.key, nameEn: t.en, nameId: t.id, colorIndex: t.c }).run();
    }
    const sourceIds = /* @__PURE__ */ new Map();
    const sourceFor = (title) => {
      if (!sourceIds.has(title)) {
        const r = db2.insert(sources).values({ title, kind: "note", text: "", createdAt: now3 }).returning({ id: sources.id }).get();
        sourceIds.set(title, r.id);
      }
      return sourceIds.get(title);
    };
    for (const n of NODES0) {
      db2.insert(concepts).values({
        id: n.id,
        labelEn: n.label.en,
        labelId: n.label.id,
        summaryEn: n.summary.en,
        summaryId: n.summary.id,
        mastery: n.mastery,
        misconception: false,
        auto: false,
        createdAt: now3,
        updatedAt: now3
      }).run();
      n.topics.forEach((k, i) => db2.insert(conceptDomains).values({ conceptId: n.id, domainKey: k, position: i }).run());
      for (const src of n.sources) {
        db2.insert(conceptSources).values({ conceptId: n.id, sourceId: sourceFor(src.t), note: src.n }).run();
      }
      for (const v of n.vocab) {
        db2.insert(vocab).values({ conceptId: n.id, termEn: v.en, termId: v.id, example: v.ex || "" }).run();
      }
      for (const q of n.quiz) {
        db2.insert(questions).values({
          conceptId: n.id,
          kind: "mcq",
          payloadJson: JSON.stringify({ q: q.q, o: q.o, a: q.a, why: q.why }),
          bridgeConceptId: q.bridge || null,
          aiGenerated: false,
          createdAt: now3
        }).run();
      }
    }
    for (const l of LINKS0) {
      db2.insert(links).values({ fromId: l.source, toId: l.target, type: l.type, status: "approved", createdAt: now3 }).run();
    }
  });
  tx();
}
function seedAiDefaults(db2) {
  const s = db2.$client;
  const tx = s.transaction(() => {
    const now3 = Date.now();
    const addProvider = (kind, name, baseUrl) => db2.insert(providers).values({ kind, name, baseUrl, enabled: true, createdAt: now3 }).returning({ id: providers.id }).get().id;
    const addModel = (providerId, modelId, label, inP, outP, ctx, notes) => db2.insert(models).values({ providerId, modelId, label, inputPrice: inP, outputPrice: outP, contextWindow: ctx, maxOutput: 4096, notes, enabled: true, createdAt: now3 }).returning({ id: models.id }).get().id;
    const anth = addProvider("anthropic", "Anthropic API", null);
    const haiku = addModel(anth, "claude-haiku-5-5", "Claude Haiku 5.5", 0.1, 0.5, 1e6, "Fast and cheap. Prices from the Claude pricing page, Nov 2026.");
    const sonnet = addModel(anth, "claude-sonnet-5-5", "Claude Sonnet 5.5", 2, 10, 1e6, "Balanced quality and cost.");
    const opus = addModel(anth, "claude-opus-5-5", "Claude Opus 5.5", 4, 20, 1e6, "Best for grading and deep reasoning.");
    addProvider("openrouter", "OpenRouter", "https://openrouter.ai/api/v1");
    const gem = addProvider("gemini", "Google Gemini", "https://generativelanguage.googleapis.com/v1beta/openai");
    addModel(gem, "gemini-3.8-flash", "Gemini 3.8 Flash", 0.75, 3.75, 1048576, "Has a free tier (free-tier data may be used by Google). Paid price shown.");
    addModel(gem, "gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite", 0.3, 2.5, 1048576, "Free tier available. Check the price on Google's pricing page.");
    const oll = addProvider("ollama", "Ollama (local)", "http://localhost:11434");
    addModel(oll, "qwen3:8b", "Qwen3 8B (local)", 0, 0, 32768, "Free, runs on your PC. Download it on the Ollama card first.");
    const addEmbed = (providerId, modelId, label, inP, notes) => db2.insert(models).values({ providerId, modelId, label, inputPrice: inP, outputPrice: 0, maxOutput: 4096, purpose: "embed", notes, enabled: true, createdAt: now3 }).run();
    addEmbed(oll, "nomic-embed-text", "Nomic Embed (local)", 0, "Free search model. Download it on the Ollama card first.");
    addEmbed(gem, "gemini-embedding-001", "Gemini Embedding", 0.15, "Search model. Check the price on Google's pricing page.");
    s.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('tiers',?)").run(JSON.stringify({ quick: haiku, balanced: sonnet, deep: opus }));
  });
  tx();
}

// lib/db/index.ts
var DATA_DIR = process.env.NEURON_DATA_DIR || path.join(process.cwd(), "data");
var DB_PATH = path.join(DATA_DIR, "neuron.db");
var INIT_SQL = `
CREATE TABLE IF NOT EXISTS domains (key TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_id TEXT NOT NULL, color_index INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS concepts (id TEXT PRIMARY KEY, label_en TEXT NOT NULL, label_id TEXT NOT NULL DEFAULT '', summary_en TEXT NOT NULL DEFAULT '', summary_id TEXT NOT NULL DEFAULT '', user_definition TEXT, mastery INTEGER NOT NULL DEFAULT 0, misconception INTEGER NOT NULL DEFAULT 0, auto INTEGER NOT NULL DEFAULT 0, origin_source_id INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS concept_domains (concept_id TEXT NOT NULL, domain_key TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (concept_id, domain_key));
CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'text', url_or_path TEXT, text TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER NOT NULL, idx INTEGER NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS concept_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, source_id INTEGER NOT NULL, chunk_id INTEGER, note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, from_id TEXT NOT NULL, to_id TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'suggested', why_en TEXT, why_id TEXT, source_id INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS vocab (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, term_en TEXT NOT NULL, term_id TEXT NOT NULL, example TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL, bridge_concept_id TEXT, ai_generated INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, question_id INTEGER, kind TEXT NOT NULL, correct INTEGER NOT NULL, score INTEGER, confidence TEXT NOT NULL, mastery_delta INTEGER NOT NULL, answer_text TEXT, feedback_json TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS glossary (term TEXT PRIMARY KEY, definition TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS review_cards (concept_id TEXT PRIMARY KEY, fsrs_state_json TEXT NOT NULL, due_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS providers (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, name TEXT NOT NULL, base_url TEXT, api_key TEXT, enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS models (id INTEGER PRIMARY KEY AUTOINCREMENT, provider_id INTEGER NOT NULL, model_id TEXT NOT NULL, label TEXT NOT NULL, input_price REAL NOT NULL DEFAULT 0, output_price REAL NOT NULL DEFAULT 0, context_window INTEGER, max_output INTEGER NOT NULL DEFAULT 4096, notes TEXT, enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS usage_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, provider_id INTEGER, provider_kind TEXT NOT NULL, provider_name TEXT NOT NULL, model_row_id INTEGER, model_id TEXT NOT NULL, feature TEXT NOT NULL, depth TEXT NOT NULL, concept_id TEXT, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0, estimated INTEGER NOT NULL DEFAULT 0, cost_usd REAL NOT NULL DEFAULT 0, latency_ms INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, error TEXT);
CREATE INDEX IF NOT EXISTS idx_links_from ON links(from_id);
CREATE INDEX IF NOT EXISTS idx_links_to ON links(to_id);
CREATE INDEX IF NOT EXISTS idx_attempts_concept ON attempts(concept_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_concept ON chats(concept_id);
`;
function migrate(sqlite) {
  const has = (table, col) => sqlite.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
  if (!has("chunks", "page")) sqlite.exec("ALTER TABLE chunks ADD COLUMN page INTEGER");
  if (!has("concept_sources", "quote")) sqlite.exec("ALTER TABLE concept_sources ADD COLUMN quote TEXT");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id)");
  sqlite.exec("CREATE TABLE IF NOT EXISTS writings (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL DEFAULT 'writing', title TEXT NOT NULL, body TEXT NOT NULL, brief_json TEXT NOT NULL DEFAULT '{}', concept_ids TEXT NOT NULL DEFAULT '[]', lang TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
  sqlite.exec("CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY AUTOINCREMENT, goal TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'probing', start_summary TEXT, probe_json TEXT NOT NULL DEFAULT '[]', steps_json TEXT NOT NULL DEFAULT '[]', current INTEGER NOT NULL DEFAULT 0, summary TEXT, next_json TEXT NOT NULL DEFAULT '[]', lang TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
  if (!has("writings", "post_json")) sqlite.exec("ALTER TABLE writings ADD COLUMN post_json TEXT");
  sqlite.exec("CREATE TABLE IF NOT EXISTS embeddings (kind TEXT NOT NULL, ref_id TEXT NOT NULL, model TEXT NOT NULL, hash TEXT NOT NULL, vector BLOB NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (kind, ref_id))");
  if (!has("models", "purpose")) {
    sqlite.exec("ALTER TABLE models ADD COLUMN purpose TEXT NOT NULL DEFAULT 'chat'");
    const now3 = Date.now();
    const prov = (kind) => sqlite.prepare("SELECT id FROM providers WHERE kind = ? ORDER BY id LIMIT 1").get(kind);
    const add = (pid, modelId, label, price, notes) => {
      if (pid) sqlite.prepare("INSERT INTO models (provider_id, model_id, label, input_price, output_price, context_window, max_output, purpose, notes, enabled, created_at) VALUES (?, ?, ?, ?, 0, NULL, 4096, 'embed', ?, 1, ?)").run(pid, modelId, label, price, notes, now3);
    };
    add(prov("ollama")?.id, "nomic-embed-text", "Nomic Embed (local)", 0, "Free search model. Download it on the Ollama card first.");
    add(prov("gemini")?.id, "gemini-embedding-001", "Gemini Embedding", 0.15, "Search model. Check the price on Google's pricing page.");
  }
}
function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = OFF");
  sqlite.exec(INIT_SQL);
  migrate(sqlite);
  const db2 = drizzle(sqlite, { schema: schema_exports });
  const count = sqlite.prepare("SELECT COUNT(*) AS n FROM concepts").get();
  const seeded = sqlite.prepare("SELECT value FROM settings WHERE key='seeded'").get();
  if (!seeded && count.n === 0) {
    seedDemo(db2);
    sqlite.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('seeded','1')").run();
  }
  const prov = sqlite.prepare("SELECT COUNT(*) AS n FROM providers").get();
  if (prov.n === 0) seedAiDefaults(db2);
  return db2;
}
var g = globalThis;
function getDb() {
  if (!g.__neuronDb) g.__neuronDb = open();
  return g.__neuronDb;
}

// lib/logic.ts
var TYPES = {
  prerequisite: { say: { en: "is needed for", id: "dibutuhkan untuk" }, dir: true, name: { en: "Needed for", id: "Dibutuhkan untuk" } },
  part_of: { say: { en: "is part of", id: "bagian dari" }, dir: true, name: { en: "Part of", id: "Bagian dari" } },
  causes: { say: { en: "leads to", id: "menyebabkan" }, dir: true, name: { en: "Leads to", id: "Menyebabkan" } },
  contrasts: { say: { en: "contrasts with", id: "berlawanan dengan" }, dir: false, name: { en: "Contrasts", id: "Berlawanan" } },
  example_of: { say: { en: "is an example of", id: "contoh dari" }, dir: true, name: { en: "Example of", id: "Contoh dari" } },
  related: { say: { en: "relates to", id: "berkaitan dengan" }, dir: false, name: { en: "Related", id: "Berkaitan" } }
};
var LINK_TYPES = Object.keys(TYPES);
var level = (m) => m === 0 ? "unseen" : m < 60 ? "shaky" : "solid";
var CBM = {
  right: { guess: 6, fair: 14, sure: 20 },
  wrong: { guess: 0, fair: -8, sure: -18 }
};
function mcqDelta(right, conf, bridge) {
  let d = CBM[right ? "right" : "wrong"][conf];
  if (right && bridge && conf !== "guess") d += 5;
  return d;
}
function essayDelta(score, conf) {
  const raw = (score - 50) / 50 * 20;
  const mult = raw >= 0 ? { guess: 0.5, fair: 0.85, sure: 1.1 }[conf] : { guess: 0.3, fair: 0.8, sure: 1.3 }[conf];
  return Math.round(raw * mult);
}
var clampMastery = (m) => Math.max(0, Math.min(100, Math.round(m)));
function slug(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "c";
}
function isDue(c, now3 = Date.now()) {
  if (c.miscon) return true;
  if (c.review) return c.review.due <= now3;
  return c.mastery < 60;
}
function due(concepts2, now3 = Date.now()) {
  const rank = (c) => c.miscon ? 0 : c.review ? 1 : 2;
  return concepts2.filter((c) => isDue(c, now3)).sort((a, b) => rank(a) - rank(b) || (a.review && b.review ? a.review.due - b.review.due : 0) || a.mastery - b.mastery);
}
function upcoming(concepts2, now3 = Date.now()) {
  return concepts2.filter((c) => !c.miscon && c.review && c.review.due > now3).sort((a, b) => a.review.due - b.review.due);
}
function chainBack(links2, id, seen = /* @__PURE__ */ new Set([id])) {
  const out = [];
  links2.filter((l) => l.status === "approved" && l.to === id && (l.type === "prerequisite" || l.type === "part_of")).forEach((l) => {
    if (seen.has(l.from)) return;
    seen.add(l.from);
    out.push(...chainBack(links2, l.from, seen), { id: l.from, type: l.type });
  });
  return out;
}

// lib/extract.ts
function chunkText(text2, pageStart = 1, paged = false) {
  const pages = text2.split("\f");
  const multi = paged || pages.length > 1 || pageStart > 1;
  const out = [];
  pages.forEach((p, pi) => {
    let cur = "";
    const flush = () => {
      if (cur.trim()) out.push({ page: multi ? pageStart + pi : null, text: cur.trim() });
      cur = "";
    };
    for (const para of p.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)) {
      if (para.length > 1400) {
        flush();
        const sentences = para.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [para];
        for (const s of sentences) {
          if ((cur + s).length > 1100) flush();
          cur += s;
        }
        flush();
      } else {
        if ((cur + "\n\n" + para).length > 1100) flush();
        cur = cur ? cur + "\n\n" + para : para;
      }
    }
    flush();
  });
  return out;
}
var norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
function bestChunk(quote, chunks2) {
  const q = norm(quote);
  if (!q || !chunks2.length) return null;
  const exact = chunks2.find((c) => norm(c.text).includes(q));
  if (exact) return exact.id;
  const words = new Set(q.split(" ").filter((w) => w.length > 3));
  if (!words.size) return null;
  let best = null;
  for (const c of chunks2) {
    const cw = new Set(norm(c.text).split(" "));
    let hit = 0;
    words.forEach((w) => {
      if (cw.has(w)) hit++;
    });
    const score = hit / words.size;
    if (!best || score > best.score) best = { id: c.id, score };
  }
  return best && best.score >= 0.5 ? best.id : null;
}

// node_modules/ts-fsrs/dist/index.mjs
var FSRSError = class _FSRSError extends Error {
  constructor(message = "FSRS Error") {
    super(message);
    this.name = "FSRSError";
    Error.captureStackTrace?.(this, _FSRSError);
  }
};
var FSRSValidationError = class _FSRSValidationError extends FSRSError {
  constructor(message) {
    super(message);
    this.name = "FSRSValidationError";
    Error.captureStackTrace?.(this, _FSRSValidationError);
  }
};
var State = /* @__PURE__ */ ((State2) => {
  State2[State2["New"] = 0] = "New";
  State2[State2["Learning"] = 1] = "Learning";
  State2[State2["Review"] = 2] = "Review";
  State2[State2["Relearning"] = 3] = "Relearning";
  return State2;
})(State || {});
var Rating = /* @__PURE__ */ ((Rating2) => {
  Rating2[Rating2["Manual"] = 0] = "Manual";
  Rating2[Rating2["Again"] = 1] = "Again";
  Rating2[Rating2["Hard"] = 2] = "Hard";
  Rating2[Rating2["Good"] = 3] = "Good";
  Rating2[Rating2["Easy"] = 4] = "Easy";
  return Rating2;
})(Rating || {});
var TypeConvert = class _TypeConvert {
  static card(card) {
    return {
      ...card,
      state: _TypeConvert.state(card.state),
      due: _TypeConvert.time(card.due),
      last_review: card.last_review ? _TypeConvert.time(card.last_review) : void 0
    };
  }
  static rating(value) {
    if (typeof value === "string") {
      const firstLetter = value.charAt(0).toUpperCase();
      const restOfString = value.slice(1).toLowerCase();
      const ret = Rating[`${firstLetter}${restOfString}`];
      if (ret === void 0) {
        throw new FSRSValidationError(`Invalid rating:[${value}]`);
      }
      return ret;
    } else if (typeof value === "number") {
      return value;
    }
    throw new FSRSValidationError(`Invalid rating:[${value}]`);
  }
  static state(value) {
    if (typeof value === "string") {
      const firstLetter = value.charAt(0).toUpperCase();
      const restOfString = value.slice(1).toLowerCase();
      const ret = State[`${firstLetter}${restOfString}`];
      if (ret === void 0) {
        throw new FSRSValidationError(`Invalid state:[${value}]`);
      }
      return ret;
    } else if (typeof value === "number") {
      return value;
    }
    throw new FSRSValidationError(`Invalid state:[${value}]`);
  }
  static time(value) {
    if (value instanceof Date) {
      return value;
    }
    const date = new Date(value);
    if (typeof value === "object" && value !== null && !Number.isNaN(Date.parse(value) || +date)) {
      return date;
    } else if (typeof value === "string") {
      const timestamp = Date.parse(value);
      if (!Number.isNaN(timestamp)) {
        return new Date(timestamp);
      } else {
        throw new FSRSValidationError(`Invalid date:[${value}]`);
      }
    } else if (typeof value === "number") {
      return new Date(value);
    }
    throw new FSRSValidationError(`Invalid date:[${value}]`);
  }
  static review_log(log) {
    return {
      ...log,
      due: _TypeConvert.time(log.due),
      rating: _TypeConvert.rating(log.rating),
      state: _TypeConvert.state(log.state),
      review: _TypeConvert.time(log.review)
    };
  }
};
Date.prototype.scheduler = function(t, isDay) {
  return date_scheduler(this, t, isDay);
};
Date.prototype.diff = function(pre, unit) {
  return date_diff(this, pre, unit);
};
Date.prototype.format = function() {
  return formatDate(this);
};
Date.prototype.dueFormat = function(last_review, unit, timeUnit) {
  return show_diff_message(this, last_review, unit, timeUnit);
};
function date_scheduler(now3, t, isDay) {
  return new Date(
    isDay ? TypeConvert.time(now3).getTime() + t * 24 * 60 * 60 * 1e3 : TypeConvert.time(now3).getTime() + t * 60 * 1e3
  );
}
function date_diff(now3, pre, unit) {
  if (!now3 || !pre) {
    throw new FSRSValidationError("Invalid date");
  }
  const diff = TypeConvert.time(now3).getTime() - TypeConvert.time(pre).getTime();
  let r = 0;
  switch (unit) {
    case "days":
      r = Math.floor(diff / (24 * 60 * 60 * 1e3));
      break;
    case "minutes":
      r = Math.floor(diff / (60 * 1e3));
      break;
  }
  return r;
}
function formatDate(dateInput) {
  const date = TypeConvert.time(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hours)}:${padZero(
    minutes
  )}:${padZero(seconds)}`;
}
function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}
var TIMEUNIT = [60, 60, 24, 31, 12];
var TIMEUNITFORMAT = ["second", "min", "hour", "day", "month", "year"];
function show_diff_message(due2, last_review, unit, timeUnit = TIMEUNITFORMAT) {
  due2 = TypeConvert.time(due2);
  last_review = TypeConvert.time(last_review);
  if (timeUnit.length !== TIMEUNITFORMAT.length) {
    timeUnit = TIMEUNITFORMAT;
  }
  let diff = due2.getTime() - last_review.getTime();
  let i = 0;
  diff /= 1e3;
  for (i = 0; i < TIMEUNIT.length; i++) {
    if (diff < TIMEUNIT[i]) {
      break;
    } else {
      diff /= TIMEUNIT[i];
    }
  }
  return `${Math.floor(diff)}${unit ? timeUnit[i] : ""}`;
}
var Grades = Object.freeze([
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy
]);
var FUZZ_RANGES = [
  {
    start: 2.5,
    end: 7,
    factor: 0.15
  },
  {
    start: 7,
    end: 20,
    factor: 0.1
  },
  {
    start: 20,
    end: Infinity,
    factor: 0.05
  }
];
function get_fuzz_range(interval, elapsed_days, maximum_interval) {
  let delta = 1;
  for (const range of FUZZ_RANGES) {
    delta += range.factor * Math.max(Math.min(interval, range.end) - range.start, 0);
  }
  interval = Math.min(interval, maximum_interval);
  let min_ivl = Math.max(2, Math.round(interval - delta));
  const max_ivl = Math.min(Math.round(interval + delta), maximum_interval);
  if (interval > elapsed_days) {
    min_ivl = Math.max(min_ivl, elapsed_days + 1);
  }
  min_ivl = Math.min(min_ivl, max_ivl);
  return { min_ivl, max_ivl };
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function roundTo(num, decimals) {
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}
function dateDiffInDays(last, cur) {
  const utc1 = Date.UTC(
    last.getUTCFullYear(),
    last.getUTCMonth(),
    last.getUTCDate()
  );
  const utc2 = Date.UTC(
    cur.getUTCFullYear(),
    cur.getUTCMonth(),
    cur.getUTCDate()
  );
  return Math.floor(
    (utc2 - utc1) / 864e5
    /** 1000 * 60 * 60 * 24*/
  );
}
var ConvertStepUnitToMinutes = (step) => {
  const unit = step.slice(-1);
  const value = parseInt(step.slice(0, -1), 10);
  if (Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
    throw new FSRSValidationError(`Invalid step value: ${step}`);
  }
  switch (unit) {
    case "m":
      return value;
    case "h":
      return value * 60;
    case "d":
      return value * 1440;
    default:
      throw new FSRSValidationError(
        `Invalid step unit: ${step}, expected m/h/d`
      );
  }
};
var BasicLearningStepsStrategy = (params, state, cur_step) => {
  const learning_steps = state === State.Relearning || state === State.Review ? params.relearning_steps : params.learning_steps;
  const steps_length = learning_steps.length;
  if (steps_length === 0 || cur_step >= steps_length) return {};
  const firstStep = learning_steps[0];
  const toMinutes = ConvertStepUnitToMinutes;
  const getAgainInterval = () => {
    return toMinutes(firstStep);
  };
  const getHardInterval = () => {
    if (steps_length === 1) return Math.round(toMinutes(firstStep) * 1.5);
    const nextStep = learning_steps[1];
    return Math.round((toMinutes(firstStep) + toMinutes(nextStep)) / 2);
  };
  const getStepInfo = (index) => {
    if (index < 0 || index >= steps_length) {
      return null;
    } else {
      return learning_steps[index];
    }
  };
  const getGoodMinutes = (step) => {
    return toMinutes(step);
  };
  const result = {};
  const step_info = getStepInfo(Math.max(0, cur_step));
  if (state === State.Review) {
    result[Rating.Again] = {
      scheduled_minutes: toMinutes(step_info),
      next_step: 0
    };
    return result;
  } else {
    result[Rating.Again] = {
      scheduled_minutes: getAgainInterval(),
      next_step: 0
    };
    result[Rating.Hard] = {
      scheduled_minutes: getHardInterval(),
      next_step: cur_step
    };
    const next_info = getStepInfo(cur_step + 1);
    if (next_info) {
      const nextMin = getGoodMinutes(next_info);
      if (nextMin) {
        result[Rating.Good] = {
          scheduled_minutes: Math.round(nextMin),
          next_step: cur_step + 1
        };
      }
    }
  }
  return result;
};
function DefaultInitSeedStrategy() {
  const time = this.review_time.getTime();
  const reps = this.current.reps;
  const mul = this.current.difficulty * this.current.stability;
  return `${time}_${reps}_${mul}`;
}
var StrategyMode = /* @__PURE__ */ ((StrategyMode2) => {
  StrategyMode2["SCHEDULER"] = "Scheduler";
  StrategyMode2["LEARNING_STEPS"] = "LearningSteps";
  StrategyMode2["SEED"] = "Seed";
  return StrategyMode2;
})(StrategyMode || {});
var AbstractScheduler = class {
  last;
  current;
  review_time;
  next = /* @__PURE__ */ new Map();
  algorithm;
  strategies;
  elapsed_days = 0;
  // init
  constructor(card, now3, algorithm, strategies) {
    this.algorithm = algorithm;
    this.last = TypeConvert.card(card);
    this.current = TypeConvert.card(card);
    this.review_time = TypeConvert.time(now3);
    this.strategies = strategies;
    this.init();
  }
  checkGrade(grade) {
    if (!Number.isFinite(grade) || grade < 1 || grade > 4) {
      throw new FSRSValidationError(`Invalid grade "${grade}",expected 1-4`);
    }
  }
  init() {
    const { state, last_review } = this.current;
    let interval = 0;
    if (state !== State.New && last_review) {
      interval = dateDiffInDays(last_review, this.review_time);
    }
    this.current.last_review = this.review_time;
    this.elapsed_days = interval;
    this.current.elapsed_days = interval;
    this.current.reps += 1;
    let seed_strategy = DefaultInitSeedStrategy;
    if (this.strategies) {
      const custom_strategy = this.strategies.get(StrategyMode.SEED);
      if (custom_strategy) {
        seed_strategy = custom_strategy;
      }
    }
    this.algorithm.seed = seed_strategy.call(this);
  }
  preview() {
    return {
      [Rating.Again]: this.review(Rating.Again),
      [Rating.Hard]: this.review(Rating.Hard),
      [Rating.Good]: this.review(Rating.Good),
      [Rating.Easy]: this.review(Rating.Easy),
      [Symbol.iterator]: this.previewIterator.bind(this)
    };
  }
  *previewIterator() {
    for (const grade of Grades) {
      yield this.review(grade);
    }
  }
  review(grade) {
    const { state } = this.last;
    let item;
    this.checkGrade(grade);
    switch (state) {
      case State.New:
        item = this.newState(grade);
        break;
      case State.Learning:
      case State.Relearning:
        item = this.learningState(grade);
        break;
      case State.Review:
        item = this.reviewState(grade);
        break;
    }
    return item;
  }
  buildLog(rating) {
    const { last_review, due: due2, elapsed_days } = this.last;
    return {
      rating,
      state: this.current.state,
      due: last_review || due2,
      stability: this.current.stability,
      difficulty: this.current.difficulty,
      elapsed_days: this.elapsed_days,
      last_elapsed_days: elapsed_days,
      scheduled_days: this.current.scheduled_days,
      learning_steps: this.current.learning_steps,
      review: this.review_time
    };
  }
};
var Alea = class {
  c;
  s0;
  s1;
  s2;
  constructor(seed) {
    const mash = Mash();
    this.c = 1;
    this.s0 = mash(" ");
    this.s1 = mash(" ");
    this.s2 = mash(" ");
    if (seed == null) seed = Date.now();
    this.s0 -= mash(seed);
    if (this.s0 < 0) this.s0 += 1;
    this.s1 -= mash(seed);
    if (this.s1 < 0) this.s1 += 1;
    this.s2 -= mash(seed);
    if (this.s2 < 0) this.s2 += 1;
  }
  next() {
    const t = 2091639 * this.s0 + this.c * 23283064365386963e-26;
    this.s0 = this.s1;
    this.s1 = this.s2;
    this.c = t | 0;
    this.s2 = t - this.c;
    return this.s2;
  }
  set state(state) {
    this.c = state.c;
    this.s0 = state.s0;
    this.s1 = state.s1;
    this.s2 = state.s2;
  }
  get state() {
    return {
      c: this.c,
      s0: this.s0,
      s1: this.s1,
      s2: this.s2
    };
  }
};
function Mash() {
  let n = 4022871197;
  return function mash(data) {
    data = String(data);
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 4294967296;
    }
    return (n >>> 0) * 23283064365386963e-26;
  };
}
function alea(seed) {
  const xg = new Alea(seed);
  const prng = () => xg.next();
  prng.int32 = () => xg.next() * 4294967296 | 0;
  prng.double = () => prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
  prng.state = () => xg.state;
  prng.importState = (state) => {
    xg.state = state;
    return prng;
  };
  return prng;
}
var version2 = "5.4.2";
var default_request_retention = 0.9;
var default_maximum_interval = 36500;
var default_enable_fuzz = false;
var default_enable_short_term = true;
var default_learning_steps = Object.freeze([
  "1m",
  "10m"
]);
var default_relearning_steps = Object.freeze([
  "10m"
]);
var FSRSVersion = `v${version2} using FSRS-6.0`;
var S_MIN = 1e-3;
var INIT_S_MAX = 100;
var FSRS5_DEFAULT_DECAY = 0.5;
var FSRS6_DEFAULT_DECAY = 0.1542;
var default_w = Object.freeze([
  0.212,
  1.2931,
  2.3065,
  8.2956,
  6.4133,
  0.8334,
  3.0194,
  1e-3,
  1.8722,
  0.1666,
  0.796,
  1.4835,
  0.0614,
  0.2629,
  1.6483,
  0.6014,
  1.8729,
  0.5425,
  0.0912,
  0.0658,
  FSRS6_DEFAULT_DECAY
]);
var W17_W18_Ceiling = 2;
var CLAMP_PARAMETERS = (w17_w18_ceiling, enable_short_term = default_enable_short_term) => [
  [S_MIN, INIT_S_MAX],
  [S_MIN, INIT_S_MAX],
  [S_MIN, INIT_S_MAX],
  [S_MIN, INIT_S_MAX],
  [1, 10],
  [1e-3, 4],
  [1e-3, 4],
  [1e-3, 0.75],
  [0, 4.5],
  [0, 0.8],
  [1e-3, 3.5],
  [1e-3, 5],
  [1e-3, 0.25],
  [1e-3, 0.9],
  [0, 4],
  [0, 1],
  [1, 6],
  [0, w17_w18_ceiling],
  [0, w17_w18_ceiling],
  [
    enable_short_term ? 0.01 : 0,
    0.8
  ],
  [0.1, 0.8]
];
var clipParameters = (parameters, numRelearningSteps, enableShortTerm = default_enable_short_term) => {
  const clip = CLAMP_PARAMETERS(W17_W18_Ceiling, enableShortTerm).slice(
    0,
    parameters.length
  );
  if (Math.max(0, numRelearningSteps) > 1) {
    const w11 = clamp(parameters[11] || 0, clip[11][0], clip[11][1]);
    const w13 = clamp(parameters[13] || 0, clip[13][0], clip[13][1]);
    const w14 = clamp(parameters[14] || 0, clip[14][0], clip[14][1]);
    const value = -(Math.log(w11) + Math.log(Math.pow(2, w13) - 1) + w14 * 0.3) / numRelearningSteps;
    const w17_w18_ceiling = clamp(
      roundTo(Math.sqrt(Math.max(value, 0)), 8),
      0.01,
      W17_W18_Ceiling
    );
    if (clip[17]) clip[17] = [clip[17][0], w17_w18_ceiling];
    if (clip[18]) clip[18] = [clip[18][0], w17_w18_ceiling];
  }
  return clip.map(
    ([min, max], index) => clamp(parameters[index] || 0, min, max)
  );
};
var migrateParameters = (parameters, numRelearningSteps = 0, enableShortTerm = default_enable_short_term) => {
  if (parameters === void 0) {
    return [...default_w];
  }
  switch (parameters.length) {
    case 21:
      return clipParameters(
        Array.from(parameters),
        numRelearningSteps,
        enableShortTerm
      );
    case 19:
      console.debug("[FSRS-6]auto fill w from 19 to 21 length");
      return clipParameters(
        Array.from(parameters),
        numRelearningSteps,
        enableShortTerm
      ).concat([0, FSRS5_DEFAULT_DECAY]);
    case 17: {
      const w = clipParameters(
        Array.from(parameters),
        numRelearningSteps,
        enableShortTerm
      );
      w[4] = +(w[5] * 2 + w[4]).toFixed(8);
      w[5] = +(Math.log(w[5] * 3 + 1) / 3).toFixed(8);
      w[6] = +(w[6] + 0.5).toFixed(8);
      console.debug("[FSRS-6]auto fill w from 17 to 21 length");
      return w.concat([0, 0, 0, FSRS5_DEFAULT_DECAY]);
    }
    default:
      console.warn("[FSRS]Invalid parameters length, using default parameters");
      return [...default_w];
  }
};
var generatorParameters = (props) => {
  const learning_steps = Array.isArray(props?.learning_steps) ? props.learning_steps : default_learning_steps;
  const relearning_steps = Array.isArray(props?.relearning_steps) ? props.relearning_steps : default_relearning_steps;
  const enable_short_term = props?.enable_short_term ?? default_enable_short_term;
  const w = migrateParameters(
    props?.w,
    relearning_steps.length,
    enable_short_term
  );
  return {
    request_retention: props?.request_retention || default_request_retention,
    maximum_interval: props?.maximum_interval || default_maximum_interval,
    w,
    enable_fuzz: props?.enable_fuzz ?? default_enable_fuzz,
    enable_short_term,
    learning_steps,
    relearning_steps
  };
};
function createEmptyCard(now3, afterHandler) {
  const emptyCard = {
    due: now3 ? TypeConvert.time(now3) : /* @__PURE__ */ new Date(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    learning_steps: 0,
    state: State.New,
    last_review: void 0
  };
  if (afterHandler && typeof afterHandler === "function") {
    return afterHandler(emptyCard);
  } else {
    return emptyCard;
  }
}
var computeDecayFactor = (decayOrParams) => {
  const decay = typeof decayOrParams === "number" ? -decayOrParams : -decayOrParams[20];
  const factor = Math.exp(Math.pow(decay, -1) * Math.log(0.9)) - 1;
  return { decay, factor: roundTo(factor, 8) };
};
function forgetting_curve(decayOrParams, elapsed_days, stability) {
  const { decay, factor } = computeDecayFactor(decayOrParams);
  return roundTo(Math.pow(1 + factor * elapsed_days / stability, decay), 8);
}
var FSRSAlgorithm = class {
  param;
  intervalModifier;
  _seed;
  constructor(params) {
    this.param = new Proxy(
      this.prepare_parameters(params),
      this.params_handler_proxy()
    );
    this.intervalModifier = this.calculate_interval_modifier(
      this.param.request_retention
    );
    this.forgetting_curve = forgetting_curve.bind(this, this.param.w);
  }
  get interval_modifier() {
    return this.intervalModifier;
  }
  set seed(seed) {
    this._seed = seed;
  }
  /**
   * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-5
   *
   * The formula used is: $$I(r,s) = (r^{\frac{1}{DECAY}} - 1) / FACTOR \times s$$
   * @param request_retention 0<request_retention<=1,Requested retention rate
   * @throws {Error} Requested retention rate should be in the range (0,1]
   */
  calculate_interval_modifier(request_retention) {
    if (request_retention <= 0 || request_retention > 1) {
      throw new FSRSValidationError(
        "Requested retention rate should be in the range (0,1]"
      );
    }
    const { decay, factor } = computeDecayFactor(this.param.w);
    return roundTo((Math.pow(request_retention, 1 / decay) - 1) / factor, 8);
  }
  /**
   * Get the parameters of the algorithm.
   */
  get parameters() {
    return this.param;
  }
  /**
   * Set the parameters of the algorithm.
   * @param params Partial<FSRSParameters>
   */
  set parameters(params) {
    this.update_parameters(params);
  }
  params_handler_proxy() {
    const _this = this;
    return {
      set: function(target, prop, value) {
        if (prop === "request_retention" && Number.isFinite(value)) {
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(value)
          );
        } else if (prop === "w") {
          value = migrateParameters(
            value,
            target.relearning_steps.length,
            target.enable_short_term
          );
          value = clipParameters(
            Array.from(value),
            target.relearning_steps.length,
            target.enable_short_term
          );
          _this.forgetting_curve = forgetting_curve.bind(this, value);
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(target.request_retention)
          );
        }
        Reflect.set(target, prop, value);
        return true;
      }
    };
  }
  update_parameters(params) {
    const _params = this.prepare_parameters(params);
    for (const key in _params) {
      const paramKey = key;
      this.param[paramKey] = _params[paramKey];
    }
  }
  prepare_parameters = (params) => {
    const generated = generatorParameters(params);
    generated.w = clipParameters(
      Array.from(generated.w),
      generated.relearning_steps.length,
      generated.enable_short_term
    );
    return generated;
  };
  /**
     * The formula used is :
     * $$ S_0(G) = w_{G-1}$$
     * $$S_0 = \max \lbrace S_0,0.1\rbrace $$
  
     * @param g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
     * @return Stability (interval when R=90%)
     */
  init_stability(g2) {
    return Math.max(this.param.w[g2 - 1], 0.1);
  }
  /**
   * The formula used is :
   * $$D_0(G) = w_4 - e^{(G-1) \cdot w_5} + 1 $$
   * $$D_0 = \min \lbrace \max \lbrace D_0(G),1 \rbrace,10 \rbrace$$
   * where the $$D_0(1)=w_4$$ when the first rating is good.
   *
   * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return {number} Difficulty $$D \in [1,10]$$
   */
  init_difficulty(g2) {
    const w = this.param.w;
    const d = w[4] - Math.exp((g2 - 1) * w[5]) + 1;
    return roundTo(d, 8);
  }
  /**
   * If fuzzing is disabled or ivl is less than 2.5, it returns the original interval.
   * @param {number} ivl - The interval to be fuzzed.
   * @param {number} elapsed_days t days since the last review
   * @return {number} - The fuzzed interval.
   **/
  apply_fuzz(ivl, elapsed_days) {
    if (!this.param.enable_fuzz || ivl < 2.5) return Math.round(ivl);
    const generator = alea(this._seed);
    const fuzz_factor = generator();
    const { min_ivl, max_ivl } = get_fuzz_range(
      ivl,
      elapsed_days,
      this.param.maximum_interval
    );
    return Math.floor(fuzz_factor * (max_ivl - min_ivl + 1) + min_ivl);
  }
  /**
   *   @see The formula used is : {@link FSRSAlgorithm.calculate_interval_modifier}
   *   @param {number} s - Stability (interval when R=90%)
   *   @param {number} elapsed_days t days since the last review
   */
  next_interval(s, elapsed_days) {
    const newInterval = Math.min(
      Math.max(1, Math.round(s * this.intervalModifier)),
      this.param.maximum_interval
    );
    return this.apply_fuzz(newInterval, elapsed_days);
  }
  /**
   * @see https://github.com/open-spaced-repetition/fsrs4anki/issues/697
   */
  linear_damping(delta_d, old_d) {
    return roundTo(delta_d * (10 - old_d) / 9, 8);
  }
  /**
   * The formula used is :
   * $$\text{delta}_d = -w_6 \cdot (g - 3)$$
   * $$\text{next}_d = D + \text{linear damping}(\text{delta}_d , D)$$
   * $$D^\prime(D,R) = w_7 \cdot D_0(4) +(1 - w_7) \cdot \text{next}_d$$
   * @param {number} d Difficulty $$D \in [1,10]$$
   * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return {number} $$\text{next}_D$$
   */
  next_difficulty(d, g2) {
    const delta_d = -this.param.w[6] * (g2 - 3);
    const next_d = d + this.linear_damping(delta_d, d);
    return clamp(
      this.mean_reversion(this.init_difficulty(Rating.Easy), next_d),
      1,
      10
    );
  }
  /**
   * The formula used is :
   * $$w_7 \cdot \text{init} +(1 - w_7) \cdot \text{current}$$
   * @param {number} init $$w_2 : D_0(3) = w_2 + (R-2) \cdot w_3= w_2$$
   * @param {number} current $$D - w_6 \cdot (R - 2)$$
   * @return {number} difficulty
   */
  mean_reversion(init, current) {
    const w = this.param.w;
    return roundTo(w[7] * init + (1 - w[7]) * current, 8);
  }
  /**
   * The formula used is :
   * $$S^\prime_r(D,S,R,G) = S\cdot(e^{w_8}\cdot (11-D)\cdot S^{-w_9}\cdot(e^{w_{10}\cdot(1-R)}-1)\cdot w_{15}(\text{if} G=2) \cdot w_{16}(\text{if} G=4)+1)$$
   * @param {number} d Difficulty D \in [1,10]
   * @param {number} s Stability (interval when R=90%)
   * @param {number} r Retrievability (probability of recall)
   * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
   * @return {number} S^\prime_r new stability after recall
   */
  next_recall_stability(d, s, r, g2) {
    const w = this.param.w;
    const hard_penalty = Rating.Hard === g2 ? w[15] : 1;
    const easy_bound = Rating.Easy === g2 ? w[16] : 1;
    return roundTo(
      clamp(
        s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hard_penalty * easy_bound),
        S_MIN,
        36500
      ),
      8
    );
  }
  /**
   * The formula used is :
   * $$S^\prime_f(D,S,R) = w_{11}\cdot D^{-w_{12}}\cdot ((S+1)^{w_{13}}-1) \cdot e^{w_{14}\cdot(1-R)}$$
   * enable_short_term = true : $$S^\prime_f \in \min \lbrace \max \lbrace S^\prime_f,0.01\rbrace, \frac{S}{e^{w_{17} \cdot w_{18}}} \rbrace$$
   * enable_short_term = false : $$S^\prime_f \in \min \lbrace \max \lbrace S^\prime_f,0.01\rbrace, S \rbrace$$
   * @param {number} d Difficulty D \in [1,10]
   * @param {number} s Stability (interval when R=90%)
   * @param {number} r Retrievability (probability of recall)
   * @return {number} S^\prime_f new stability after forgetting
   */
  next_forget_stability(d, s, r) {
    const w = this.param.w;
    return roundTo(
      clamp(
        w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]),
        S_MIN,
        36500
      ),
      8
    );
  }
  /**
   * The formula used is :
   * $$S^\prime_s(S,G) = S \cdot e^{w_{17} \cdot (G-3+w_{18})}$$
   * @param {number} s Stability (interval when R=90%)
   * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
   */
  next_short_term_stability(s, g2) {
    const w = this.param.w;
    const sinc = Math.pow(s, -w[19]) * Math.exp(w[17] * (g2 - 3 + w[18]));
    const maskedSinc = g2 >= Rating.Hard ? Math.max(sinc, 1) : sinc;
    return roundTo(clamp(s * maskedSinc, S_MIN, 36500), 8);
  }
  /**
   * The formula used is :
   * $$R(t,S) = (1 + \text{FACTOR} \times \frac{t}{9 \cdot S})^{\text{DECAY}}$$
   * @param {number} elapsed_days t days since the last review
   * @param {number} stability Stability (interval when R=90%)
   * @return {number} r Retrievability (probability of recall)
   */
  forgetting_curve;
  /**
   * Calculates the next state of memory based on the current state, time elapsed, and grade.
   *
   * @param memory_state - The current state of memory, which can be null.
   * @param t - The time elapsed since the last review.
   * @param {Rating} g Grade (Rating[0.Manual,1.Again,2.Hard,3.Good,4.Easy])
   * @param r - Optional retrievability value. If not provided, it will be calculated.
   * @returns The next state of memory with updated difficulty and stability.
   */
  next_state(memory_state, t, g2, r) {
    const { difficulty: d, stability: s } = memory_state ?? {
      difficulty: 0,
      stability: 0
    };
    if (t < 0) {
      throw new FSRSValidationError(`Invalid delta_t "${t}"`);
    }
    if (g2 < 0 || g2 > 4) {
      throw new FSRSValidationError(`Invalid grade "${g2}"`);
    }
    if (d === 0 && s === 0) {
      return {
        difficulty: clamp(this.init_difficulty(g2), 1, 10),
        stability: this.init_stability(g2)
      };
    }
    if (g2 === 0) {
      return {
        difficulty: d,
        stability: s
      };
    }
    if (d < 1 || s < S_MIN) {
      throw new FSRSValidationError(
        `Invalid memory state { difficulty: ${d}, stability: ${s} }`
      );
    }
    const w = this.param.w;
    r = typeof r === "number" ? r : this.forgetting_curve(t, s);
    let new_s;
    if (t === 0 && this.param.enable_short_term) {
      new_s = this.next_short_term_stability(s, g2);
    } else if (g2 === 1) {
      const s_after_fail = this.next_forget_stability(d, s, r);
      let [w_17, w_18] = [0, 0];
      if (this.param.enable_short_term) {
        w_17 = w[17];
        w_18 = w[18];
      }
      const next_s_min = s / Math.exp(w_17 * w_18);
      new_s = clamp(roundTo(next_s_min, 8), S_MIN, s_after_fail);
    } else {
      new_s = this.next_recall_stability(d, s, r, g2);
    }
    const new_d = this.next_difficulty(d, g2);
    return { difficulty: new_d, stability: new_s };
  }
};
var BasicScheduler = class extends AbstractScheduler {
  learningStepsStrategy;
  constructor(card, now3, algorithm, strategies) {
    super(card, now3, algorithm, strategies);
    let learningStepStrategy = BasicLearningStepsStrategy;
    if (this.strategies) {
      const custom_strategy = this.strategies.get(StrategyMode.LEARNING_STEPS);
      if (custom_strategy) {
        learningStepStrategy = custom_strategy;
      }
    }
    this.learningStepsStrategy = learningStepStrategy;
  }
  getLearningInfo(card, grade) {
    const parameters = this.algorithm.parameters;
    card.learning_steps = card.learning_steps || 0;
    const steps_strategy = this.learningStepsStrategy(
      parameters,
      card.state,
      card.learning_steps
    );
    const scheduled_minutes = Math.max(
      0,
      steps_strategy[grade]?.scheduled_minutes ?? 0
    );
    const next_steps = Math.max(0, steps_strategy[grade]?.next_step ?? 0);
    return {
      scheduled_minutes,
      next_steps
    };
  }
  /**
   * @description This function applies the learning steps based on the current card's state and grade.
   */
  applyLearningSteps(nextCard, grade, to_state) {
    const { scheduled_minutes, next_steps } = this.getLearningInfo(
      this.current,
      grade
    );
    if (scheduled_minutes > 0 && scheduled_minutes < 1440) {
      nextCard.learning_steps = next_steps;
      nextCard.scheduled_days = 0;
      nextCard.state = to_state;
      nextCard.due = date_scheduler(
        this.review_time,
        Math.round(scheduled_minutes),
        false
        /** true:days false: minute */
      );
    } else {
      nextCard.state = State.Review;
      if (scheduled_minutes >= 1440) {
        nextCard.learning_steps = next_steps;
        nextCard.due = date_scheduler(
          this.review_time,
          Math.round(scheduled_minutes),
          false
          /** true:days false: minute */
        );
        nextCard.scheduled_days = Math.floor(scheduled_minutes / 1440);
      } else {
        nextCard.learning_steps = 0;
        const interval = this.algorithm.next_interval(
          nextCard.stability,
          this.elapsed_days
        );
        nextCard.scheduled_days = interval;
        nextCard.due = date_scheduler(this.review_time, interval, true);
      }
    }
  }
  newState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const next = this.next_ds(this.elapsed_days, grade);
    this.applyLearningSteps(next, grade, State.Learning);
    const item = {
      card: next,
      log: this.buildLog(grade)
    };
    this.next.set(grade, item);
    return item;
  }
  learningState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const next = this.next_ds(this.elapsed_days, grade);
    this.applyLearningSteps(
      next,
      grade,
      this.last.state
      /** Learning or Relearning */
    );
    const item = {
      card: next,
      log: this.buildLog(grade)
    };
    this.next.set(grade, item);
    return item;
  }
  reviewState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const interval = this.elapsed_days;
    const retrievability = this.algorithm.forgetting_curve(
      interval,
      this.current.stability
    );
    const next_again = this.next_ds(interval, Rating.Again, retrievability);
    const next_hard = this.next_ds(interval, Rating.Hard, retrievability);
    const next_good = this.next_ds(interval, Rating.Good, retrievability);
    const next_easy = this.next_ds(interval, Rating.Easy, retrievability);
    this.next_interval(next_hard, next_good, next_easy, interval);
    this.next_state(next_hard, next_good, next_easy);
    this.applyLearningSteps(next_again, Rating.Again, State.Relearning);
    next_again.lapses += 1;
    const item_again = {
      card: next_again,
      log: this.buildLog(Rating.Again)
    };
    const item_hard = {
      card: next_hard,
      log: super.buildLog(Rating.Hard)
    };
    const item_good = {
      card: next_good,
      log: super.buildLog(Rating.Good)
    };
    const item_easy = {
      card: next_easy,
      log: super.buildLog(Rating.Easy)
    };
    this.next.set(Rating.Again, item_again);
    this.next.set(Rating.Hard, item_hard);
    this.next.set(Rating.Good, item_good);
    this.next.set(Rating.Easy, item_easy);
    return this.next.get(grade);
  }
  /**
   * Review next_ds
   */
  next_ds(t, g2, r) {
    const next_state = this.algorithm.next_state(
      {
        difficulty: this.current.difficulty,
        stability: this.current.stability
      },
      t,
      g2,
      r
    );
    const card = TypeConvert.card(this.current);
    card.difficulty = next_state.difficulty;
    card.stability = next_state.stability;
    return card;
  }
  /**
   * Review next_interval
   */
  next_interval(next_hard, next_good, next_easy, interval) {
    let hard_interval, good_interval;
    hard_interval = this.algorithm.next_interval(next_hard.stability, interval);
    good_interval = this.algorithm.next_interval(next_good.stability, interval);
    hard_interval = Math.min(hard_interval, good_interval);
    good_interval = Math.max(good_interval, hard_interval + 1);
    const easy_interval = Math.max(
      this.algorithm.next_interval(next_easy.stability, interval),
      good_interval + 1
    );
    next_hard.scheduled_days = hard_interval;
    next_hard.due = date_scheduler(this.review_time, hard_interval, true);
    next_good.scheduled_days = good_interval;
    next_good.due = date_scheduler(this.review_time, good_interval, true);
    next_easy.scheduled_days = easy_interval;
    next_easy.due = date_scheduler(this.review_time, easy_interval, true);
  }
  /**
   * Review next_state
   */
  next_state(next_hard, next_good, next_easy) {
    next_hard.state = State.Review;
    next_hard.learning_steps = 0;
    next_good.state = State.Review;
    next_good.learning_steps = 0;
    next_easy.state = State.Review;
    next_easy.learning_steps = 0;
  }
};
var LongTermScheduler = class extends AbstractScheduler {
  newState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    this.current.scheduled_days = 0;
    this.current.elapsed_days = 0;
    const first_interval = 0;
    const next_again = this.next_ds(first_interval, Rating.Again);
    const next_hard = this.next_ds(first_interval, Rating.Hard);
    const next_good = this.next_ds(first_interval, Rating.Good);
    const next_easy = this.next_ds(first_interval, Rating.Easy);
    this.next_interval(
      next_again,
      next_hard,
      next_good,
      next_easy,
      first_interval
    );
    this.next_state(next_again, next_hard, next_good, next_easy);
    this.update_next(next_again, next_hard, next_good, next_easy);
    return this.next.get(grade);
  }
  next_ds(t, g2, r) {
    const next_state = this.algorithm.next_state(
      {
        difficulty: this.current.difficulty,
        stability: this.current.stability
      },
      t,
      g2,
      r
    );
    const card = TypeConvert.card(this.current);
    card.difficulty = next_state.difficulty;
    card.stability = next_state.stability;
    return card;
  }
  /**
   * @see https://github.com/open-spaced-repetition/ts-fsrs/issues/98#issuecomment-2241923194
   */
  learningState(grade) {
    return this.reviewState(grade);
  }
  reviewState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const interval = this.elapsed_days;
    const retrievability = this.algorithm.forgetting_curve(
      interval,
      this.current.stability
    );
    const next_again = this.next_ds(interval, Rating.Again, retrievability);
    const next_hard = this.next_ds(interval, Rating.Hard, retrievability);
    const next_good = this.next_ds(interval, Rating.Good, retrievability);
    const next_easy = this.next_ds(interval, Rating.Easy, retrievability);
    this.next_interval(next_again, next_hard, next_good, next_easy, interval);
    this.next_state(next_again, next_hard, next_good, next_easy);
    next_again.lapses += 1;
    this.update_next(next_again, next_hard, next_good, next_easy);
    return this.next.get(grade);
  }
  /**
   * Review/New next_interval
   */
  next_interval(next_again, next_hard, next_good, next_easy, interval) {
    let again_interval, hard_interval, good_interval, easy_interval;
    again_interval = this.algorithm.next_interval(
      next_again.stability,
      interval
    );
    hard_interval = this.algorithm.next_interval(next_hard.stability, interval);
    good_interval = this.algorithm.next_interval(next_good.stability, interval);
    easy_interval = this.algorithm.next_interval(next_easy.stability, interval);
    again_interval = Math.min(again_interval, hard_interval);
    hard_interval = Math.max(hard_interval, again_interval + 1);
    good_interval = Math.max(good_interval, hard_interval + 1);
    easy_interval = Math.max(easy_interval, good_interval + 1);
    next_again.scheduled_days = again_interval;
    next_again.due = date_scheduler(this.review_time, again_interval, true);
    next_hard.scheduled_days = hard_interval;
    next_hard.due = date_scheduler(this.review_time, hard_interval, true);
    next_good.scheduled_days = good_interval;
    next_good.due = date_scheduler(this.review_time, good_interval, true);
    next_easy.scheduled_days = easy_interval;
    next_easy.due = date_scheduler(this.review_time, easy_interval, true);
  }
  /**
   * Review/New next_state
   */
  next_state(next_again, next_hard, next_good, next_easy) {
    next_again.state = State.Review;
    next_again.learning_steps = 0;
    next_hard.state = State.Review;
    next_hard.learning_steps = 0;
    next_good.state = State.Review;
    next_good.learning_steps = 0;
    next_easy.state = State.Review;
    next_easy.learning_steps = 0;
  }
  update_next(next_again, next_hard, next_good, next_easy) {
    const item_again = {
      card: next_again,
      log: this.buildLog(Rating.Again)
    };
    const item_hard = {
      card: next_hard,
      log: super.buildLog(Rating.Hard)
    };
    const item_good = {
      card: next_good,
      log: super.buildLog(Rating.Good)
    };
    const item_easy = {
      card: next_easy,
      log: super.buildLog(Rating.Easy)
    };
    this.next.set(Rating.Again, item_again);
    this.next.set(Rating.Hard, item_hard);
    this.next.set(Rating.Good, item_good);
    this.next.set(Rating.Easy, item_easy);
  }
};
var Reschedule = class {
  fsrs;
  /**
   * Creates an instance of the `Reschedule` class.
   * @param fsrs - An instance of the FSRS class used for scheduling.
   */
  constructor(fsrs2) {
    this.fsrs = fsrs2;
  }
  /**
   * Replays a review for a card and determines the next review date based on the given rating.
   * @param card - The card being reviewed.
   * @param reviewed - The date the card was reviewed.
   * @param rating - The grade given to the card during the review.
   * @returns A `RecordLogItem` containing the updated card and review log.
   */
  replay(card, reviewed, rating) {
    return this.fsrs.next(card, reviewed, rating);
  }
  /**
   * Processes a manual review for a card, allowing for custom state, stability, difficulty, and due date.
   * @param card - The card being reviewed.
   * @param state - The state of the card after the review.
   * @param reviewed - The date the card was reviewed.
   * @param elapsed_days - The number of days since the last review.
   * @param stability - (Optional) The stability of the card.
   * @param difficulty - (Optional) The difficulty of the card.
   * @param due - (Optional) The due date for the next review.
   * @returns A `RecordLogItem` containing the updated card and review log.
   * @throws Will throw an error if the state or due date is not provided when required.
   */
  handleManualRating(card, state, reviewed, elapsed_days, stability, difficulty, due2) {
    if (typeof state === "undefined") {
      throw new FSRSValidationError(
        "reschedule: state is required for manual rating"
      );
    }
    let log;
    let next_card;
    if (state === State.New) {
      log = {
        rating: Rating.Manual,
        state,
        due: due2 ?? reviewed,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days,
        last_elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        learning_steps: card.learning_steps,
        review: reviewed
      };
      next_card = createEmptyCard(reviewed);
      next_card.last_review = reviewed;
    } else {
      if (typeof due2 === "undefined") {
        throw new FSRSValidationError(
          "reschedule: due is required for manual rating"
        );
      }
      const scheduled_days = date_diff(due2, reviewed, "days");
      log = {
        rating: Rating.Manual,
        state: card.state,
        due: card.last_review || card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days,
        last_elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        learning_steps: card.learning_steps,
        review: reviewed
      };
      next_card = {
        ...card,
        state,
        due: due2,
        last_review: reviewed,
        stability: stability || card.stability,
        difficulty: difficulty || card.difficulty,
        elapsed_days,
        scheduled_days,
        reps: card.reps + 1
      };
    }
    return { card: next_card, log };
  }
  /**
   * Reschedules a card based on its review history.
   *
   * @param current_card - The card to be rescheduled.
   * @param reviews - An array of review history objects.
   * @returns An array of record log items representing the rescheduling process.
   */
  reschedule(current_card, reviews) {
    const collections = [];
    let cur_card = createEmptyCard(current_card.due);
    for (const review of reviews) {
      let item;
      review.review = TypeConvert.time(review.review);
      if (review.rating === Rating.Manual) {
        let interval = 0;
        if (cur_card.state !== State.New && cur_card.last_review) {
          interval = date_diff(review.review, cur_card.last_review, "days");
        }
        item = this.handleManualRating(
          cur_card,
          review.state,
          review.review,
          interval,
          review.stability,
          review.difficulty,
          review.due ? TypeConvert.time(review.due) : void 0
        );
      } else {
        item = this.replay(cur_card, review.review, review.rating);
      }
      collections.push(item);
      cur_card = item.card;
    }
    return collections;
  }
  calculateManualRecord(current_card, now3, record_log_item, update_memory) {
    if (!record_log_item) {
      return null;
    }
    const { card: reschedule_card, log } = record_log_item;
    const cur_card = TypeConvert.card(current_card);
    if (cur_card.due.getTime() === reschedule_card.due.getTime()) {
      return null;
    }
    cur_card.scheduled_days = date_diff(
      reschedule_card.due,
      cur_card.due,
      "days"
    );
    return this.handleManualRating(
      cur_card,
      reschedule_card.state,
      TypeConvert.time(now3),
      log.elapsed_days,
      update_memory ? reschedule_card.stability : void 0,
      update_memory ? reschedule_card.difficulty : void 0,
      reschedule_card.due
    );
  }
};
function applyAfterHandler(value, afterHandler) {
  return typeof afterHandler === "function" ? afterHandler(value) : value;
}
var FSRS = class extends FSRSAlgorithm {
  strategyHandler = /* @__PURE__ */ new Map();
  Scheduler;
  constructor(param) {
    super(param);
    const { enable_short_term } = this.parameters;
    this.Scheduler = enable_short_term ? BasicScheduler : LongTermScheduler;
  }
  params_handler_proxy() {
    const _this = this;
    return {
      set: function(target, prop, value) {
        if (prop === "request_retention" && Number.isFinite(value)) {
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(value)
          );
        } else if (prop === "enable_short_term") {
          _this.Scheduler = value === true ? BasicScheduler : LongTermScheduler;
        } else if (prop === "w") {
          value = migrateParameters(
            value,
            target.relearning_steps.length,
            target.enable_short_term
          );
          value = clipParameters(
            Array.from(value),
            target.relearning_steps.length,
            target.enable_short_term
          );
          _this.forgetting_curve = forgetting_curve.bind(this, value);
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(target.request_retention)
          );
        }
        Reflect.set(target, prop, value);
        return true;
      }
    };
  }
  useStrategy(mode, handler) {
    this.strategyHandler.set(mode, handler);
    return this;
  }
  clearStrategy(mode) {
    if (mode) {
      this.strategyHandler.delete(mode);
    } else {
      this.strategyHandler.clear();
    }
    return this;
  }
  getScheduler(card, now3) {
    const schedulerStrategy = this.strategyHandler.get(
      StrategyMode.SCHEDULER
    );
    const Scheduler = schedulerStrategy || this.Scheduler;
    const instance = new Scheduler(card, now3, this, this.strategyHandler);
    return instance;
  }
  /**
   * Display the collection of cards and logs for the four scenarios after scheduling the card at the current time.
   * @param card Card to be processed
   * @param now Current time or scheduled time
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const card: Card = createEmptyCard(new Date());
   * const f = fsrs();
   * const recordLog = f.repeat(card, new Date());
   * ```
   * @example
   * ```typescript
   * interface RevLogUnchecked
   *   extends Omit<ReviewLog, "due" | "review" | "state" | "rating"> {
   *   cid: string;
   *   due: Date | number;
   *   state: StateType;
   *   review: Date | number;
   *   rating: RatingType;
   * }
   *
   * interface RepeatRecordLog {
   *   card: CardUnChecked; //see method: createEmptyCard
   *   log: RevLogUnchecked;
   * }
   *
   * function repeatAfterHandler(recordLog: RecordLog) {
   *     const record: { [key in Grade]: RepeatRecordLog } = {} as {
   *       [key in Grade]: RepeatRecordLog;
   *     };
   *     for (const grade of Grades) {
   *       record[grade] = {
   *         card: {
   *           ...(recordLog[grade].card as Card & { cid: string }),
   *           due: recordLog[grade].card.due.getTime(),
   *           state: State[recordLog[grade].card.state] as StateType,
   *           last_review: recordLog[grade].card.last_review
   *             ? recordLog[grade].card.last_review!.getTime()
   *             : null,
   *         },
   *         log: {
   *           ...recordLog[grade].log,
   *           cid: (recordLog[grade].card as Card & { cid: string }).cid,
   *           due: recordLog[grade].log.due.getTime(),
   *           review: recordLog[grade].log.review.getTime(),
   *           state: State[recordLog[grade].log.state] as StateType,
   *           rating: Rating[recordLog[grade].log.rating] as RatingType,
   *         },
   *       };
   *     }
   *     return record;
   * }
   * const card: Card = createEmptyCard(new Date(), cardAfterHandler); //see method:  createEmptyCard
   * const f = fsrs();
   * const recordLog = f.repeat(card, new Date(), repeatAfterHandler);
   * ```
   */
  repeat(card, now3, afterHandler) {
    const instance = this.getScheduler(card, now3);
    const recordLog = instance.preview();
    return applyAfterHandler(recordLog, afterHandler);
  }
  /**
   * Display the collection of cards and logs for the card scheduled at the current time, after applying a specific grade rating.
   * @param card Card to be processed
   * @param now Current time or scheduled time
   * @param grade Rating of the review (Again, Hard, Good, Easy)
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const card: Card = createEmptyCard(new Date());
   * const f = fsrs();
   * const recordLogItem = f.next(card, new Date(), Rating.Again);
   * ```
   * @example
   * ```typescript
   * interface RevLogUnchecked
   *   extends Omit<ReviewLog, "due" | "review" | "state" | "rating"> {
   *   cid: string;
   *   due: Date | number;
   *   state: StateType;
   *   review: Date | number;
   *   rating: RatingType;
   * }
   *
   * interface NextRecordLog {
   *   card: CardUnChecked; //see method: createEmptyCard
   *   log: RevLogUnchecked;
   * }
   *
  function nextAfterHandler(recordLogItem: RecordLogItem) {
    const recordItem = {
      card: {
        ...(recordLogItem.card as Card & { cid: string }),
        due: recordLogItem.card.due.getTime(),
        state: State[recordLogItem.card.state] as StateType,
        last_review: recordLogItem.card.last_review
          ? recordLogItem.card.last_review!.getTime()
          : null,
      },
      log: {
        ...recordLogItem.log,
        cid: (recordLogItem.card as Card & { cid: string }).cid,
        due: recordLogItem.log.due.getTime(),
        review: recordLogItem.log.review.getTime(),
        state: State[recordLogItem.log.state] as StateType,
        rating: Rating[recordLogItem.log.rating] as RatingType,
      },
    };
    return recordItem
  }
   * const card: Card = createEmptyCard(new Date(), cardAfterHandler); //see method:  createEmptyCard
   * const f = fsrs();
   * const recordLogItem = f.repeat(card, new Date(), Rating.Again, nextAfterHandler);
   * ```
   */
  next(card, now3, grade, afterHandler) {
    const instance = this.getScheduler(card, now3);
    const g2 = TypeConvert.rating(grade);
    if (g2 === Rating.Manual) {
      throw new FSRSValidationError("Cannot review a manual rating");
    }
    const recordLogItem = instance.review(g2);
    return applyAfterHandler(recordLogItem, afterHandler);
  }
  /**
   * Get the retrievability of the card
   * @param card  Card to be processed
   * @param now  Current time or scheduled time
   * @param format  default:true , Convert the result to another type. (Optional)
   * @returns  The retrievability of the card,if format is true, the result is a string, otherwise it is a number
   */
  get_retrievability(card, now3, format = true) {
    const processedCard = TypeConvert.card(card);
    now3 = now3 ? TypeConvert.time(now3) : /* @__PURE__ */ new Date();
    const t = processedCard.state !== State.New ? Math.max(date_diff(now3, processedCard.last_review, "days"), 0) : 0;
    const r = processedCard.state !== State.New ? this.forgetting_curve(t, +processedCard.stability.toFixed(8)) : 0;
    return format ? `${(r * 100).toFixed(2)}%` : r;
  }
  /**
   *
   * @param card Card to be processed
   * @param log last review log
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const now = new Date();
   * const f = fsrs();
   * const emptyCardFormAfterHandler = createEmptyCard(now);
   * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now);
   * const { card, log } = repeatFormAfterHandler[Rating.Hard];
   * const rollbackFromAfterHandler = f.rollback(card, log);
   * ```
   *
   * @example
   * ```typescript
   * const now = new Date();
   * const f = fsrs();
   * const emptyCardFormAfterHandler = createEmptyCard(now, cardAfterHandler);  //see method: createEmptyCard
   * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now, repeatAfterHandler); //see method: fsrs.repeat()
   * const { card, log } = repeatFormAfterHandler[Rating.Hard];
   * const rollbackFromAfterHandler = f.rollback(card, log, cardAfterHandler);
   * ```
   */
  rollback(card, log, afterHandler) {
    const processedCard = TypeConvert.card(card);
    const processedLog = TypeConvert.review_log(log);
    if (processedLog.rating === Rating.Manual) {
      throw new FSRSValidationError("Cannot rollback a manual rating");
    }
    let last_due;
    let last_review;
    let last_lapses;
    switch (processedLog.state) {
      case State.New:
        last_due = processedLog.due;
        last_review = void 0;
        last_lapses = 0;
        break;
      case State.Learning:
      case State.Relearning:
      case State.Review:
        last_due = processedLog.review;
        last_review = processedLog.due;
        last_lapses = processedCard.lapses - (processedLog.rating === Rating.Again && processedLog.state === State.Review ? 1 : 0);
        break;
    }
    const prevCard = {
      ...processedCard,
      due: last_due,
      stability: processedLog.stability,
      difficulty: processedLog.difficulty,
      elapsed_days: processedLog.last_elapsed_days,
      scheduled_days: processedLog.scheduled_days,
      reps: Math.max(0, processedCard.reps - 1),
      lapses: Math.max(0, last_lapses),
      learning_steps: processedLog.learning_steps,
      state: processedLog.state,
      last_review
    };
    return applyAfterHandler(prevCard, afterHandler);
  }
  /**
   *
   * @param card Card to be processed
   * @param now Current time or scheduled time
   * @param reset_count Should the review count information(reps,lapses) be reset. (Optional)
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const now = new Date();
   * const f = fsrs();
   * const emptyCard = createEmptyCard(now);
   * const scheduling_cards = f.repeat(emptyCard, now);
   * const { card, log } = scheduling_cards[Rating.Hard];
   * const forgetCard = f.forget(card, new Date(), true);
   * ```
   *
   * @example
   * ```typescript
   * interface RepeatRecordLog {
   *   card: CardUnChecked; //see method: createEmptyCard
   *   log: RevLogUnchecked; //see method: fsrs.repeat()
   * }
   *
   * function forgetAfterHandler(recordLogItem: RecordLogItem): RepeatRecordLog {
   *     return {
   *       card: {
   *         ...(recordLogItem.card as Card & { cid: string }),
   *         due: recordLogItem.card.due.getTime(),
   *         state: State[recordLogItem.card.state] as StateType,
   *         last_review: recordLogItem.card.last_review
   *           ? recordLogItem.card.last_review!.getTime()
   *           : null,
   *       },
   *       log: {
   *         ...recordLogItem.log,
   *         cid: (recordLogItem.card as Card & { cid: string }).cid,
   *         due: recordLogItem.log.due.getTime(),
   *         review: recordLogItem.log.review.getTime(),
   *         state: State[recordLogItem.log.state] as StateType,
   *         rating: Rating[recordLogItem.log.rating] as RatingType,
   *       },
   *     };
   * }
   * const now = new Date();
   * const f = fsrs();
   * const emptyCardFormAfterHandler = createEmptyCard(now, cardAfterHandler); //see method:  createEmptyCard
   * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now, repeatAfterHandler); //see method: fsrs.repeat()
   * const { card } = repeatFormAfterHandler[Rating.Hard];
   * const forgetFromAfterHandler = f.forget(card, date_scheduler(now, 1, true), false, forgetAfterHandler);
   * ```
   */
  forget(card, now3, reset_count = false, afterHandler) {
    const processedCard = TypeConvert.card(card);
    now3 = TypeConvert.time(now3);
    const scheduled_days = processedCard.state === State.New ? 0 : date_diff(now3, processedCard.due, "days");
    const forget_log = {
      rating: Rating.Manual,
      state: processedCard.state,
      due: processedCard.due,
      stability: processedCard.stability,
      difficulty: processedCard.difficulty,
      elapsed_days: 0,
      last_elapsed_days: processedCard.elapsed_days,
      scheduled_days,
      learning_steps: processedCard.learning_steps,
      review: now3
    };
    const forget_card = {
      ...processedCard,
      due: now3,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: reset_count ? 0 : processedCard.reps,
      lapses: reset_count ? 0 : processedCard.lapses,
      learning_steps: 0,
      state: State.New,
      last_review: processedCard.last_review
    };
    const recordLogItem = { card: forget_card, log: forget_log };
    return applyAfterHandler(recordLogItem, afterHandler);
  }
  /**
   * Reschedules the current card and returns the rescheduled collections and reschedule item.
   *
   * @template T - The type of the record log item.
   * @param {CardInput | Card} current_card - The current card to be rescheduled.
   * @param {Array<FSRSHistory>} reviews - The array of FSRSHistory objects representing the reviews.
   * @param {Partial<RescheduleOptions<T>>} options - The optional reschedule options.
   * @returns {IReschedule<T>} - The rescheduled collections and reschedule item.
   *
   * @example
   * ```typescript
   * const f = fsrs()
   * const grades: Grade[] = [Rating.Good, Rating.Good, Rating.Good, Rating.Good]
   * const reviews_at = [
   *   new Date(2024, 8, 13),
   *   new Date(2024, 8, 13),
   *   new Date(2024, 8, 17),
   *   new Date(2024, 8, 28),
   * ]
   *
   * const reviews: FSRSHistory[] = []
   * for (let i = 0; i < grades.length; i++) {
   *   reviews.push({
   *     rating: grades[i],
   *     review: reviews_at[i],
   *   })
   * }
   *
   * const results_short = scheduler.reschedule(
   *   createEmptyCard(),
   *   reviews,
   *   {
   *     skipManual: false,
   *   }
   * )
   * console.log(results_short)
   * ```
   */
  reschedule(current_card, reviews = [], options = {}) {
    const {
      recordLogHandler,
      reviewsOrderBy,
      skipManual = true,
      now: now3 = /* @__PURE__ */ new Date(),
      update_memory_state: updateMemoryState = false
    } = options;
    if (reviewsOrderBy && typeof reviewsOrderBy === "function") {
      reviews.sort(reviewsOrderBy);
    }
    if (skipManual) {
      reviews = reviews.filter((review) => review.rating !== Rating.Manual);
    }
    const rescheduleSvc = new Reschedule(this);
    const collections = rescheduleSvc.reschedule(
      options.first_card || createEmptyCard(),
      reviews
    );
    const len = collections.length;
    const cur_card = TypeConvert.card(current_card);
    const manual_item = rescheduleSvc.calculateManualRecord(
      cur_card,
      now3,
      len ? collections[len - 1] : void 0,
      updateMemoryState
    );
    return {
      collections: typeof recordLogHandler === "function" ? collections.map(recordLogHandler) : collections,
      reschedule_item: manual_item ? applyAfterHandler(manual_item, recordLogHandler) : null
    };
  }
};
var fsrs = (params) => {
  return new FSRS(params || {});
};

// lib/review.ts
var scheduler = fsrs({ enable_fuzz: true, request_retention: 0.9 });
function rateMcq(right, conf) {
  if (!right) return Rating.Again;
  return conf === "sure" ? Rating.Easy : conf === "fair" ? Rating.Good : Rating.Hard;
}
function rateEssay(score, conf) {
  if (score < 50) return Rating.Again;
  if (score < 70) return Rating.Hard;
  if (score >= 85 && conf !== "guess") return Rating.Easy;
  return Rating.Good;
}
function load(raw) {
  const c = JSON.parse(raw);
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : void 0 };
}
function scheduleReview(conceptId, grade) {
  const db2 = getDb();
  const row = db2.select().from(schema_exports.reviewCards).where(eq(schema_exports.reviewCards.conceptId, conceptId)).get();
  const now3 = /* @__PURE__ */ new Date();
  const card = row ? load(row.fsrsStateJson) : createEmptyCard(now3);
  const next = scheduler.next(card, now3, grade).card;
  const json = JSON.stringify(next);
  const due2 = next.due.getTime();
  db2.insert(schema_exports.reviewCards).values({ conceptId, fsrsStateJson: json, dueAt: due2 }).onConflictDoUpdate({ target: schema_exports.reviewCards.conceptId, set: { fsrsStateJson: json, dueAt: due2 } }).run();
  return due2;
}
function reviewInfo() {
  const rows = getDb().select().from(schema_exports.reviewCards).all();
  const m = /* @__PURE__ */ new Map();
  for (const r of rows) {
    try {
      const c = load(r.fsrsStateJson);
      m.set(r.conceptId, { due: r.dueAt, reps: c.reps, lapses: c.lapses, stability: Math.round(c.stability * 10) / 10, state: c.state, last: c.last_review ? c.last_review.getTime() : null });
    } catch {
    }
  }
  return m;
}

// lib/repo.ts
var db = () => getDb();
var now2 = () => Date.now();
function getSetting(key, fallback) {
  const r = db().select().from(schema_exports.settings).where(eq(schema_exports.settings.key, key)).get();
  if (!r) return fallback;
  try {
    return JSON.parse(r.value);
  } catch {
    return fallback;
  }
}
function setSetting(key, value) {
  db().insert(schema_exports.settings).values({ key, value: JSON.stringify(value) }).onConflictDoUpdate({ target: schema_exports.settings.key, set: { value: JSON.stringify(value) } }).run();
}
var DEFAULT_PREFS = { lang: "en", view: "domains", depth: "balanced", theme: "system" };
function getPrefs() {
  const p = { ...DEFAULT_PREFS, ...getSetting("prefs", {}) };
  if (p.lang !== "en" && p.lang !== "id") p.lang = "en";
  return p;
}
var DEFAULT_PROFILE = {
  name: "Ahmad Haidar",
  about: "University student in Informatics (Teknik Informatika). Builds web and mobile apps.",
  interests: "Technology and programming; science and nature; business and money; history, philosophy and society",
  examples: "software and AI, physics and biology, startups and personal finance, history and philosophy"
};
var DEFAULT_BLOG = {
  name: "Ahmad Haidar \xB7 Portfolio (Tulisan)",
  url: "",
  section: "/tulisan",
  adminPath: "/admin/tulisan/baru",
  lang: "id",
  audience: "Indonesian readers curious about tech, science, money and ideas: students, developers, recruiters",
  voice: "Clear, curious and honest; explains simply with real examples; no hype",
  format: "Markdown only, no HTML (it is shown as text). The page shows the title, so start the body with ## subheadings. Title max 140 characters. Slug: lowercase words joined by hyphens, max 80. Ringkasan (excerpt) max 300 characters, shown in the list and link previews. Tags: comma separated, max 200 characters. Cover image (optional): a URL, ideally 1200\xD7630. Links must start with https://."
};
function getProfile() {
  return { ...DEFAULT_PROFILE, ...getSetting("profile", {}) };
}
function getBlog() {
  return { ...DEFAULT_BLOG, ...getSetting("blog", {}) };
}
function getTiers() {
  return { quick: null, balanced: null, deep: null, ...getSetting("tiers", {}) };
}
function getGraph() {
  const d = db();
  const domains2 = d.select().from(schema_exports.domains).all().sort((a, b) => a.colorIndex - b.colorIndex).map((r) => ({ key: r.key, name: { en: r.nameEn, id: r.nameId }, color: r.colorIndex }));
  const cds = d.select().from(schema_exports.conceptDomains).all().sort((a, b) => a.position - b.position);
  const srcs = d.select().from(schema_exports.sources).all();
  const srcTitle = new Map(srcs.map((s) => [s.id, s.title]));
  const cs = d.select().from(schema_exports.conceptSources).all();
  const chunkPage = new Map(d.select({ id: schema_exports.chunks.id, page: schema_exports.chunks.page }).from(schema_exports.chunks).all().map((x) => [x.id, x.page]));
  const cards = reviewInfo();
  const vs = d.select().from(schema_exports.vocab).all();
  const qs = d.select().from(schema_exports.questions).where(eq(schema_exports.questions.kind, "mcq")).all();
  const att = d.select({ conceptId: schema_exports.attempts.conceptId, correct: schema_exports.attempts.correct, confidence: schema_exports.attempts.confidence }).from(schema_exports.attempts).all();
  const attCount = /* @__PURE__ */ new Map();
  const calibration = { total: att.length, sure: { n: 0, right: 0 }, fair: { n: 0, right: 0 }, guess: { n: 0, right: 0 } };
  for (const a of att) {
    attCount.set(a.conceptId, (attCount.get(a.conceptId) || 0) + 1);
    const b = calibration[a.confidence];
    if (b) {
      b.n++;
      if (a.correct) b.right++;
    }
  }
  const concepts2 = d.select().from(schema_exports.concepts).all().sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)).map((c) => ({
    id: c.id,
    label: { en: c.labelEn, id: c.labelId || c.labelEn },
    summary: { en: c.summaryEn, id: c.summaryId || c.summaryEn },
    userDef: c.userDefinition || null,
    mastery: c.mastery,
    miscon: !!c.misconception,
    auto: !!c.auto,
    origin: c.originSourceId ? srcTitle.get(c.originSourceId) || null : null,
    domains: cds.filter((x) => x.conceptId === c.id).map((x) => x.domainKey),
    sources: cs.filter((x) => x.conceptId === c.id).map((x) => ({ sourceId: x.sourceId, title: srcTitle.get(x.sourceId) || "Source", note: x.note, quote: x.quote || null, chunkId: x.chunkId || null, page: x.chunkId ? chunkPage.get(x.chunkId) ?? null : null })),
    vocab: vs.filter((x) => x.conceptId === c.id).map((x) => ({ vid: x.id, en: x.termEn, ind: x.termId, ex: x.example })),
    quiz: qs.filter((x) => x.conceptId === c.id).map(toMcq).filter(Boolean),
    attempts: attCount.get(c.id) || 0,
    review: cards.get(c.id) || null
  }));
  const ids = new Set(concepts2.map((c) => c.id));
  for (const c of concepts2) if (!c.domains.length && domains2[0]) c.domains = [domains2[0].key];
  const links2 = d.select().from(schema_exports.links).all().filter((l) => ids.has(l.fromId) && ids.has(l.toId)).map((l) => ({
    lid: l.id,
    from: l.fromId,
    to: l.toId,
    type: l.type,
    status: l.status,
    why: l.whyEn || l.whyId ? { en: l.whyEn || "", id: l.whyId || l.whyEn || "" } : null
  }));
  const glossary2 = d.select().from(schema_exports.glossary).all().sort((a, b) => a.createdAt - b.createdAt).map((g2) => ({ term: g2.term, definition: g2.definition }));
  const tiers = getTiers();
  const modelRows = d.select().from(schema_exports.models).all();
  const tierLabel = (id) => id ? modelRows.find((m) => m.id === id)?.label || null : null;
  return {
    domains: domains2,
    concepts: concepts2,
    links: links2,
    glossary: glossary2,
    lastImport: getSetting("last_import", null),
    prefs: getPrefs(),
    calibration,
    ai: { ready: Object.values(tiers).some(Boolean), tiers: { quick: tierLabel(tiers.quick), balanced: tierLabel(tiers.balanced), deep: tierLabel(tiers.deep) } },
    demoOffline: getSetting("demo_offline", false),
    profile: getProfile(),
    blog: getBlog()
  };
}
function toMcq(r) {
  try {
    const p = JSON.parse(r.payloadJson);
    return { qid: r.id, q: p.q, o: p.o, a: p.a, why: p.why, bridge: r.bridgeConceptId, ai: !!r.aiGenerated };
  } catch {
    return null;
  }
}
function setDefinition(id, def) {
  db().update(schema_exports.concepts).set({ userDefinition: def && def.trim() ? def.trim() : null, updatedAt: now2() }).where(eq(schema_exports.concepts.id, id)).run();
}
function addVocab(conceptId, items) {
  for (const v of items) {
    if (!v.en?.trim() || !v.ind?.trim()) continue;
    db().insert(schema_exports.vocab).values({ conceptId, termEn: v.en.trim(), termId: v.ind.trim(), example: (v.ex || "").trim() }).run();
  }
}
function addLink(from, to, type, status, why, sourceId) {
  if (from === to || !LINK_TYPES.includes(type)) return null;
  const exists2 = db().select().from(schema_exports.links).where(or(and(eq(schema_exports.links.fromId, from), eq(schema_exports.links.toId, to)), and(eq(schema_exports.links.fromId, to), eq(schema_exports.links.toId, from)))).get();
  if (exists2) return null;
  return db().insert(schema_exports.links).values({ fromId: from, toId: to, type, status, whyEn: why?.en || null, whyId: why?.id || null, sourceId: sourceId || null, createdAt: now2() }).returning({ id: schema_exports.links.id }).get().id;
}
function upsertGlossary(term, definition) {
  term = term.trim();
  definition = definition.trim();
  if (!term || !definition) return;
  const all = db().select().from(schema_exports.glossary).all();
  const hit = all.find((g2) => g2.term.toLowerCase() === term.toLowerCase());
  if (hit) db().update(schema_exports.glossary).set({ definition }).where(eq(schema_exports.glossary.term, hit.term)).run();
  else db().insert(schema_exports.glossary).values({ term, definition, createdAt: now2() }).run();
}
function applyMastery(conceptId, delta, misconception) {
  const c = db().select().from(schema_exports.concepts).where(eq(schema_exports.concepts.id, conceptId)).get();
  if (!c) return 0;
  const mastery = clampMastery(c.mastery + delta);
  db().update(schema_exports.concepts).set({ mastery, updatedAt: now2(), ...misconception === void 0 ? {} : { misconception } }).where(eq(schema_exports.concepts.id, conceptId)).run();
  return mastery;
}
function recordExternal(conceptId, r) {
  const essay = r.kind === "essay";
  const score = essay ? Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))) : null;
  const right = essay ? score >= 70 : !!r.correct;
  const delta = essay ? essayDelta(score, r.confidence) : mcqDelta(right, r.confidence, false);
  const miscon = !right && r.confidence === "sure" ? true : right && r.confidence === "sure" ? false : void 0;
  const mastery = applyMastery(conceptId, delta, miscon);
  db().insert(schema_exports.attempts).values({ conceptId, kind: essay ? "essay" : "mcq", correct: right, score, confidence: r.confidence, masteryDelta: delta, answerText: r.note ? `[Claude] ${r.note}` : "[Claude]", createdAt: now2() }).run();
  const nextReview = scheduleReview(conceptId, essay ? rateEssay(score, r.confidence) : rateMcq(right, r.confidence));
  return { right, delta, mastery, nextReview };
}
function addMcq(conceptId, p, bridge) {
  return db().insert(schema_exports.questions).values({ conceptId, kind: "mcq", payloadJson: JSON.stringify(p), bridgeConceptId: bridge, aiGenerated: true, createdAt: now2() }).returning({ id: schema_exports.questions.id }).get().id;
}
function applyImport(title, text2, r, meta = {}, similar = []) {
  if (!r || !Array.isArray(r.concepts)) throw new Error("invalid_json");
  const d = db();
  const report = { title, sourceId: null, added: [], merged: [], domains: [], links: [], unknown: (r.unknown_terms || []).map(String).filter(Boolean).slice(0, 6), at: now2() };
  const tx = d.$client.transaction(() => {
    let sourceId;
    const existing = meta.sourceId ? d.select().from(schema_exports.sources).where(eq(schema_exports.sources.id, meta.sourceId)).get() : void 0;
    if (existing) {
      sourceId = existing.id;
      d.update(schema_exports.sources).set({ text: existing.text + "\f" + text2 }).where(eq(schema_exports.sources.id, sourceId)).run();
    } else {
      sourceId = d.insert(schema_exports.sources).values({ title, kind: meta.kind || "text", urlOrPath: meta.urlOrPath || null, text: text2, createdAt: now2() }).returning({ id: schema_exports.sources.id }).get().id;
    }
    report.sourceId = sourceId;
    const startIdx = d.$client.prepare("SELECT COALESCE(MAX(idx), -1) + 1 AS n FROM chunks WHERE source_id = ?").get(sourceId).n;
    chunkText(text2, meta.pageStart || 1, !!meta.paged || meta.kind === "pdf").forEach((c, i) => d.insert(schema_exports.chunks).values({ sourceId, idx: startIdx + i, page: c.page, text: c.text }).run());
    const partChunks = d.select({ id: schema_exports.chunks.id, idx: schema_exports.chunks.idx, text: schema_exports.chunks.text }).from(schema_exports.chunks).where(eq(schema_exports.chunks.sourceId, sourceId)).all().filter((c) => c.idx >= startIdx);
    const cite = (q) => q ? bestChunk(q, partChunks) : null;
    const domainRows = () => d.select().from(schema_exports.domains).all();
    const hasDomain = (k) => domainRows().some((x) => x.key === k);
    for (const nd of r.new_domains || []) {
      if (!nd || !nd.en) continue;
      const key = slug(nd.key || nd.en);
      if (hasDomain(key)) continue;
      d.insert(schema_exports.domains).values({ key, nameEn: String(nd.en), nameId: String(nd.id || nd.en), colorIndex: domainRows().length }).run();
      report.domains.push(key);
    }
    const firstDomain = domainRows().sort((a, b) => a.colorIndex - b.colorIndex)[0]?.key;
    const keyMap = {};
    const allConcepts = () => d.select().from(schema_exports.concepts).all();
    for (const c of r.concepts) {
      if (!c || !c.label_en) continue;
      const doms = (c.domains || []).map((k) => hasDomain(k) ? k : hasDomain(slug(k)) ? slug(k) : null).filter(Boolean);
      const note = String(c.source_note || "Mentioned in this source.");
      const quote = c.quote ? String(c.quote).slice(0, 400) : null;
      const chunkId = cite(c.quote);
      const vocab2 = (c.vocab || []).filter((v) => v && v.en && v.id).map((v) => ({ en: String(v.en), ind: String(v.id), ex: String(v.ex || "") }));
      let ex = c.existing_id ? allConcepts().find((x) => x.id === c.existing_id) : void 0;
      if (!ex) ex = allConcepts().find((x) => x.labelEn.toLowerCase() === String(c.label_en).toLowerCase());
      if (ex) {
        const id = ex.id;
        const already = d.select().from(schema_exports.conceptSources).where(and(eq(schema_exports.conceptSources.conceptId, id), eq(schema_exports.conceptSources.sourceId, sourceId))).get();
        if (!already) d.insert(schema_exports.conceptSources).values({ conceptId: id, sourceId, note, quote, chunkId }).run();
        const cur = d.select().from(schema_exports.conceptDomains).where(eq(schema_exports.conceptDomains.conceptId, id)).all();
        let pos = cur.length;
        for (const k of doms) if (!cur.some((x) => x.domainKey === k) && pos < 3) d.insert(schema_exports.conceptDomains).values({ conceptId: id, domainKey: k, position: pos++ }).run();
        const curV = d.select().from(schema_exports.vocab).where(eq(schema_exports.vocab.conceptId, id)).all();
        addVocab(id, vocab2.filter((v) => !curV.some((x) => x.termEn.toLowerCase() === v.en.toLowerCase())));
        d.update(schema_exports.concepts).set({ updatedAt: now2() }).where(eq(schema_exports.concepts.id, id)).run();
        keyMap[c.key || c.label_en] = id;
        if (c.existing_id) keyMap[c.existing_id] = id;
        if (!report.merged.includes(id)) report.merged.push(id);
      } else {
        let id = slug(c.label_en), i = 2;
        const base = id;
        while (allConcepts().some((x) => x.id === id)) id = `${base}_${i++}`;
        d.insert(schema_exports.concepts).values({
          id,
          labelEn: String(c.label_en),
          labelId: String(c.label_id || c.label_en),
          summaryEn: String(c.summary_en || ""),
          summaryId: String(c.summary_id || c.summary_en || ""),
          mastery: 0,
          misconception: false,
          auto: true,
          originSourceId: sourceId,
          createdAt: now2(),
          updatedAt: now2()
        }).run();
        const topics = doms.length ? doms.slice(0, 3) : [report.domains[0] || firstDomain].filter(Boolean);
        topics.forEach((k, pos) => d.insert(schema_exports.conceptDomains).values({ conceptId: id, domainKey: k, position: pos }).run());
        d.insert(schema_exports.conceptSources).values({ conceptId: id, sourceId, note, quote, chunkId }).run();
        addVocab(id, vocab2);
        keyMap[c.key || c.label_en] = id;
        report.added.push(id);
      }
    }
    const ids = new Set(allConcepts().map((x) => x.id));
    const resolve = (k) => k ? keyMap[k] || (ids.has(k) ? k : null) : null;
    for (const l of r.links || []) {
      if (!l) continue;
      const s = resolve(l.from), t = resolve(l.to);
      if (!s || !t || s === t || !LINK_TYPES.includes(l.type)) continue;
      const lid = addLink(s, t, l.type, "suggested", { en: String(l.why_en || ""), id: String(l.why_id || "") }, sourceId);
      if (lid) report.links.push(lid);
    }
    const prev = getSetting("last_import", null);
    if (existing && prev && prev.sourceId === sourceId) {
      const uniq = (a) => [...new Set(a)];
      report.added = uniq([...prev.added, ...report.added]);
      report.merged = uniq([...prev.merged, ...report.merged]).filter((x) => !report.added.includes(x));
      report.domains = uniq([...prev.domains, ...report.domains]);
      report.links = uniq([...prev.links, ...report.links]);
      report.unknown = uniq([...prev.unknown, ...report.unknown]).slice(0, 10);
    }
    report.similar = [...existing && prev && prev.sourceId === sourceId ? prev.similar || [] : [], ...similar || []];
    report.title = existing ? existing.title : title;
    setSetting("last_import", report);
  });
  tx();
  return report;
}
var toWriting = (r) => {
  let brief2 = {}, ids = [];
  try {
    brief2 = JSON.parse(r.brief_json) || {};
  } catch {
  }
  try {
    ids = JSON.parse(r.concept_ids) || [];
  } catch {
  }
  let post = null;
  try {
    post = r.post_json ? JSON.parse(r.post_json) : null;
  } catch {
  }
  return { id: r.id, kind: r.kind === "note" ? "note" : "writing", title: r.title, body: r.body, brief: brief2, conceptIds: ids, lang: r.lang, post, createdAt: r.created_at, updatedAt: r.updated_at };
};
function listWritings(opts = {}) {
  let rows = db().$client.prepare("SELECT * FROM writings ORDER BY updated_at DESC").all().map(toWriting);
  if (opts.kind) rows = rows.filter((w) => w.kind === opts.kind);
  if (opts.concept) rows = rows.filter((w) => w.conceptIds.includes(opts.concept));
  if (opts.query) {
    const q = opts.query.toLowerCase();
    rows = rows.filter((w) => `${w.title} ${w.body} ${Object.values(w.brief).join(" ")}`.toLowerCase().includes(q));
  }
  return rows;
}
function getWriting(id) {
  const r = db().$client.prepare("SELECT * FROM writings WHERE id = ?").get(id);
  return r ? toWriting(r) : null;
}
var slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
function saveWriting(w) {
  const s = db().$client, now3 = Date.now();
  const brief2 = JSON.stringify(Object.fromEntries(Object.entries(w.brief || {}).filter(([, v]) => v != null && String(v).trim()).map(([k, v]) => [k, String(v).trim()])));
  const ids = JSON.stringify([...new Set(w.conceptIds || [])]);
  const post = w.post ? JSON.stringify(w.post) : null;
  if (w.id) {
    const r = s.prepare("UPDATE writings SET kind = ?, title = ?, body = ?, brief_json = ?, concept_ids = ?, lang = ?, post_json = COALESCE(?, post_json), updated_at = ? WHERE id = ?").run(w.kind, w.title, w.body, brief2, ids, w.lang ?? null, post, now3, w.id);
    if (r.changes) return w.id;
  }
  return Number(s.prepare("INSERT INTO writings (kind, title, body, brief_json, concept_ids, lang, post_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(w.kind, w.title, w.body, brief2, ids, w.lang ?? null, post, now3, now3).lastInsertRowid);
}
var pj = (s, d) => {
  try {
    return s ? JSON.parse(s) : d;
  } catch {
    return d;
  }
};
var toLesson = (r) => ({ id: r.id, goal: r.goal, status: ["probing", "active", "done"].includes(r.status) ? r.status : "active", startSummary: r.start_summary, probe: pj(r.probe_json, []), steps: pj(r.steps_json, []), current: r.current, summary: r.summary, next: pj(r.next_json, []), lang: r.lang, createdAt: r.created_at, updatedAt: r.updated_at });
function listLessons() {
  return db().$client.prepare("SELECT * FROM lessons ORDER BY updated_at DESC").all().map(toLesson);
}
function getLesson(id) {
  const r = db().$client.prepare("SELECT * FROM lessons WHERE id = ?").get(id);
  return r ? toLesson(r) : null;
}
function createLesson(goal, lang) {
  const t = now2();
  return Number(db().$client.prepare("INSERT INTO lessons (goal, status, lang, created_at, updated_at) VALUES (?, 'probing', ?, ?, ?)").run(goal.slice(0, 300), lang, t, t).lastInsertRowid);
}
function saveLesson(l) {
  db().$client.prepare("UPDATE lessons SET goal = ?, status = ?, start_summary = ?, probe_json = ?, steps_json = ?, current = ?, summary = ?, next_json = ?, updated_at = ? WHERE id = ?").run(l.goal, l.status, l.startSummary, JSON.stringify(l.probe), JSON.stringify(l.steps), l.current, l.summary, JSON.stringify(l.next), now2(), l.id);
}
function answerLessonCheck(id, idx, r) {
  const l = getLesson(id);
  if (!l) throw new Error(`No lesson with id ${id}`);
  const s = l.steps[idx];
  if (!s) throw new Error(`Lesson ${id} has no step ${idx + 1}`);
  s.result = { ...r, at: now2() };
  s.status = r.correct ? "passed" : "needs_review";
  let mastery = null;
  const exists2 = s.concept && db().select().from(schema_exports.concepts).where(eq(schema_exports.concepts.id, s.concept)).get();
  if (exists2) mastery = recordExternal(s.concept, { kind: "quiz", correct: r.correct, confidence: r.confidence, note: `Lesson: ${l.goal} \xB7 ${s.title}${r.misconception ? ` \xB7 confusion: ${r.misconception}` : ""}`.slice(0, 300) });
  if (r.correct && l.current === idx && idx < l.steps.length - 1) l.current = idx + 1;
  saveLesson(l);
  return { lesson: getLesson(id), mastery };
}

// lib/lesson-guide.ts
var TEACH_STEPS = [
  "1. PROBE (3-5 questions, one at a time). Ask about the ideas the goal depends on, starting from what the map already shows as solid. Mix: one 'explain in your own words', one prediction ('what happens if\u2026'), one multiple choice. Ask how sure they are (guess / fair / sure). Classify each answer: knows, partly, gap, or misconception. Don't teach yet.",
  "2. PLAN. Build 3-8 steps from the gaps to the goal, in dependency order (prerequisites first). Use existing concept ids where they fit, so results update the learner's mastery; a step can also be a new idea (concept: null). Skip what they clearly know. Call neuron_lesson_plan with start_summary (2-3 sentences: what they already understand, what is missing, any misconception), the probe results and the steps. Show the plan briefly and start.",
  "3. TEACH one step at a time:",
  "   a. PREDICT: ask one short question that makes them guess before you explain.",
  "   b. EXPLAIN in small pieces, from the learner's level and interests. Use the clearest representation for the idea: a ```mermaid flowchart for processes, causes and decisions; LaTeX ($\u2026$ inline, $$\u2026$$ block) for any formula, with every symbol explained in words; a table for comparisons; a ```svg figure for shapes, graphs or geometry; one worked example with real numbers. Fix any misconception from the probe explicitly: say what they thought, why it's tempting, and why it's wrong.",
  "   c. CHECK with one question (multiple choice with 4 options, or open). Ask how sure they are. Grade honestly; if wrong, give the smallest hint first and let them try again before explaining.",
  "   d. SAVE with neuron_lesson_step: the predict question and their prediction, the explanation exactly as you showed it (Markdown with the diagrams and math), the check, and the result. Saving the result also updates mastery and the review schedule for that concept, so don't call neuron_record_result for the same answer.",
  "4. Keep the pace: one step per message pair, no walls of text. Every 2-3 steps, ask them to explain the chain so far in one or two sentences.",
  "5. FINISH with neuron_lesson_finish: a short summary of what they now understand, what is still shaky, and 1-3 next steps (review, practice, or a blog post). Offer to save new ideas to the map with neuron_add_source and any definitions they gave with neuron_set_definition."
];
var FORMAT_GUIDE = {
  markdown: "Headings (##), short paragraphs, lists, tables, **bold** for the key idea. No HTML.",
  math: "Inline $E = mc^2$ or \\(\u2026\\); block $$A = P\\left(1+\\frac{r}{n}\\right)^{nt}$$ on its own line. KaTeX syntax. After a formula, explain each symbol in words.",
  flowchart: '```mermaid\nflowchart LR\n  A[Input] --> B{Decision?}\n  B -- yes --> C[Result]\n  B -- no --> D[Other result]\n```\nAlso available: sequenceDiagram, stateDiagram-v2, mindmap, timeline, pie, xychart-beta. Keep labels short; quote labels that contain punctuation: A["f(x) = 2x"].',
  figure: '```svg\n<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">\u2026</svg>\n```\nA simple hand-made figure (axes, curves, labeled shapes). It is shown as an image; scripts and external files don\'t load. Use currentColor-free explicit colors that read on light and dark (e.g. #2f6fde, #e0a020, #888).',
  images: "![alt text](https://\u2026) only for real, freely licensed images you are confident exist (e.g. upload.wikimedia.org). Prefer mermaid or svg you draw yourself.",
  length: "One step's explanation: 120-350 words plus at most two visuals."
};

// lib/search.ts
import crypto2 from "node:crypto";

// lib/ai/config.ts
var PROVIDER_KINDS = [
  { kind: "anthropic", name: "Anthropic API", env: "ANTHROPIC_API_KEY", defaultUrl: "https://api.anthropic.com", keyUrl: "https://console.anthropic.com/settings/keys", note: "Billed separately from a Claude.ai subscription." },
  { kind: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY", defaultUrl: "https://openrouter.ai/api/v1", keyUrl: "https://openrouter.ai/settings/keys", note: "One key for many models, including free ones." },
  { kind: "gemini", name: "Google Gemini", env: "GEMINI_API_KEY", defaultUrl: "https://generativelanguage.googleapis.com/v1beta/openai", keyUrl: "https://aistudio.google.com/apikey", note: "Has a free tier." },
  { kind: "ollama", name: "Ollama (local)", env: "OLLAMA_URL", defaultUrl: "http://localhost:11434", keyUrl: "https://ollama.com/download", note: "Free and fully local. No key needed." },
  { kind: "openai_compatible", name: "OpenAI-compatible", env: null, defaultUrl: null, keyUrl: null, note: "Any API that speaks the OpenAI chat format: OpenAI, Groq, DeepSeek, LM Studio and others." }
];
var kindInfo = (k) => PROVIDER_KINDS.find((p) => p.kind === k) || PROVIDER_KINDS[4];
function resolveKey(p) {
  if (p.apiKey) return { key: p.apiKey, source: "app" };
  const env = kindInfo(p.kind).env;
  if (env && p.kind !== "ollama" && process.env[env]) return { key: process.env[env], source: "env" };
  return { key: null, source: "none" };
}
function resolveBaseUrl(p) {
  if (p.kind === "ollama") return (p.baseUrl || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  return (p.baseUrl || kindInfo(p.kind).defaultUrl || "").replace(/\/+$/, "");
}
function getProvider(id) {
  return getDb().select().from(schema_exports.providers).where(eq(schema_exports.providers.id, id)).get() || null;
}
function getModel(id) {
  return getDb().select().from(schema_exports.models).where(eq(schema_exports.models.id, id)).get() || null;
}

// lib/ai/generate.ts
var AIError = class extends Error {
  constructor(code, message, partial) {
    super(message || code);
    this.code = code;
    this.partial = partial;
  }
  code;
  partial;
};

// lib/ai/embed.ts
function embedModelId() {
  const id = getSetting("embed_model", null);
  if (!id) return null;
  const m = getModel(id);
  return m && m.enabled ? id : null;
}
async function embed(texts, feature = "embed", signal) {
  const id = embedModelId();
  if (!id) throw new AIError("no_embed_model");
  const model = getModel(id);
  const provider = getProvider(model.providerId);
  if (!provider || !provider.enabled) throw new AIError("provider_off");
  if (provider.kind === "anthropic") throw new AIError("embed_unsupported");
  const { key } = resolveKey(provider);
  if (!key && provider.kind !== "ollama") throw new AIError("no_key");
  const base = resolveBaseUrl(provider);
  const started = Date.now();
  const sig = AbortSignal.any([AbortSignal.timeout(12e4), ...signal ? [signal] : []]);
  let vectors = [], tokens = null, status = "ok", error2 = null;
  try {
    if (provider.kind === "ollama") {
      const r = await fetch(`${base}/api/embed`, { method: "POST", signal: sig, headers: { "content-type": "application/json" }, body: JSON.stringify({ model: model.modelId, input: texts }) });
      if (!r.ok) {
        const body = await r.text();
        if (r.status === 404 || /not found/i.test(body)) throw new AIError("ollama_missing", body.slice(0, 200));
        throw new AIError("provider_error", `HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      const j = await r.json();
      vectors = j.embeddings || [];
      tokens = j.prompt_eval_count ?? null;
    } else {
      const headers = { "content-type": "application/json" };
      if (key) headers.authorization = `Bearer ${key}`;
      const r = await fetch(`${base}/embeddings`, { method: "POST", signal: sig, headers, body: JSON.stringify({ model: model.modelId, input: texts }) });
      if (!r.ok) {
        const body = await r.text();
        if (r.status === 401 || r.status === 403) throw new AIError("auth", body.slice(0, 200));
        if (r.status === 429) throw new AIError("rate_limited", body.slice(0, 200));
        if (r.status === 404) throw new AIError("model_not_found", body.slice(0, 200));
        throw new AIError("provider_error", `HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      const j = await r.json();
      vectors = (j.data || []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((d) => d.embedding);
      tokens = j.usage?.prompt_tokens ?? j.usage?.total_tokens ?? null;
    }
    if (vectors.length !== texts.length || !vectors.every((v) => Array.isArray(v) && v.length)) throw new AIError("provider_error", "The search model returned no vectors");
    return { vectors, model: `${model.id}:${model.modelId}` };
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError(e.name === "AbortError" ? "cancelled" : /fetch failed|ECONNREFUSED/.test(String(e.message)) ? "network" : "provider_error", String(e.message));
    status = err.code === "cancelled" ? "aborted" : "error";
    error2 = `${err.code}: ${err.message}`.slice(0, 500);
    throw err;
  } finally {
    const inTok = tokens ?? Math.ceil(texts.reduce((n, t) => n + t.length, 0) / 4);
    try {
      getDb().insert(schema_exports.usageLog).values({
        createdAt: Date.now(),
        providerId: provider.id,
        providerKind: provider.kind,
        providerName: provider.name,
        modelRowId: model.id,
        modelId: model.modelId,
        feature,
        depth: "search",
        inputTokens: inTok,
        outputTokens: 0,
        estimated: tokens == null,
        costUsd: inTok * model.inputPrice / 1e6,
        latencyMs: Date.now() - started,
        status,
        error: error2
      }).run();
    } catch {
    }
  }
}
var toBlob = (v) => Buffer.from(new Float32Array(v).buffer);
var fromBlob = (b) => new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// lib/search.ts
var BATCH = 32;
var hash = (s) => crypto2.createHash("sha1").update(s).digest("hex").slice(0, 16);
var modelKey = () => {
  const id = embedModelId();
  const m = id ? getModel(id) : null;
  return m ? `${m.id}:${m.modelId}` : null;
};
function conceptTexts() {
  const d = getDb();
  return d.select().from(schema_exports.concepts).all().map((c) => ({
    id: c.id,
    text: `${c.labelEn}${c.labelId && c.labelId !== c.labelEn ? ` (${c.labelId})` : ""}. ${c.summaryEn}${c.userDefinition ? ` Learner's definition: ${c.userDefinition}` : ""}`.slice(0, 2e3)
  }));
}
function chunkTexts(sourceId) {
  const d = getDb();
  const rows = sourceId ? d.select().from(schema_exports.chunks).where(eq(schema_exports.chunks.sourceId, sourceId)).all() : d.select().from(schema_exports.chunks).all();
  return rows.map((c) => ({ id: String(c.id), text: c.text.slice(0, 2e3) }));
}
function pending(kind, items, mk) {
  const have = new Map(getDb().select({ refId: schema_exports.embeddings.refId, hash: schema_exports.embeddings.hash, model: schema_exports.embeddings.model }).from(schema_exports.embeddings).where(eq(schema_exports.embeddings.kind, kind)).all().map((r) => [r.refId, r]));
  return items.filter((it) => {
    const h = have.get(it.id);
    return !h || h.model !== mk || h.hash !== hash(mk + it.text);
  });
}
async function store(kind, items, mk, signal) {
  for (let i = 0; i < items.length; i += BATCH) {
    const part = items.slice(i, i + BATCH);
    const { vectors } = await embed(part.map((p) => p.text), "index", signal);
    const d = getDb();
    d.$client.transaction(() => {
      part.forEach((p, k) => d.insert(schema_exports.embeddings).values({ kind, refId: p.id, model: mk, hash: hash(mk + p.text), vector: toBlob(vectors[k]), updatedAt: Date.now() }).onConflictDoUpdate({ target: [schema_exports.embeddings.kind, schema_exports.embeddings.refId], set: { model: mk, hash: hash(mk + p.text), vector: toBlob(vectors[k]), updatedAt: Date.now() } }).run());
    })();
  }
}
async function indexAfterImport(sourceId) {
  const mk = modelKey();
  if (!mk) return false;
  try {
    await store("concept", pending("concept", conceptTexts(), mk), mk);
    if (sourceId) await store("chunk", pending("chunk", chunkTexts(sourceId), mk), mk);
    return true;
  } catch {
    return false;
  }
}
function load2(kind, mk) {
  return getDb().select({ refId: schema_exports.embeddings.refId, vector: schema_exports.embeddings.vector }).from(schema_exports.embeddings).where(and(eq(schema_exports.embeddings.kind, kind), eq(schema_exports.embeddings.model, mk))).all().map((r) => ({ id: r.refId, v: fromBlob(r.vector) }));
}
async function search(query, k = 8, signal) {
  const q = query.trim();
  const d = getDb();
  const mk = modelKey();
  const srcTitle = new Map(d.select({ id: schema_exports.sources.id, title: schema_exports.sources.title }).from(schema_exports.sources).all().map((s) => [s.id, s.title]));
  const chunkMeta = (id) => d.select().from(schema_exports.chunks).where(eq(schema_exports.chunks.id, Number(id))).get();
  let vectors = null;
  if (mk && q) {
    try {
      vectors = (await embed([q], "search", signal)).vectors;
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }
  if (mk && q && vectors) {
    const qv = new Float32Array(vectors[0]);
    const rank = (rows) => rows.map((r) => ({ id: r.id, score: cosine(qv, r.v) })).sort((a, b) => b.score - a.score);
    const concepts3 = rank(load2("concept", mk)).slice(0, k).filter((x) => x.score > 0.25).map((x) => ({ kind: "concept", ...x }));
    const passages2 = rank(load2("chunk", mk)).slice(0, k).filter((x) => x.score > 0.25).map((x) => {
      const c = chunkMeta(x.id);
      return { kind: "chunk", ...x, text: c?.text || "", sourceId: c?.sourceId, sourceTitle: c ? srcTitle.get(c.sourceId) : "", page: c?.page ?? null };
    });
    return { semantic: true, concepts: concepts3, passages: passages2 };
  }
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const score = (t) => {
    const s = t.toLowerCase();
    return words.length ? words.filter((w) => s.includes(w)).length / words.length : 0;
  };
  const concepts2 = conceptTexts().map((c) => ({ kind: "concept", id: c.id, score: score(c.text) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  const passages = d.select().from(schema_exports.chunks).all().map((c) => ({ kind: "chunk", id: String(c.id), score: score(c.text), text: c.text, sourceId: c.sourceId, sourceTitle: srcTitle.get(c.sourceId), page: c.page })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  return { semantic: false, concepts: concepts2, passages };
}

// lib/writing-guide.ts
var GROUPS = {
  agents: { en: "Agents: who is talking to whom", id: "Pelaku: siapa berbicara kepada siapa" },
  conditions: { en: "Conditions: the five conditions of the situation", id: "Kondisi: lima kondisi situasinya" },
  craft: { en: "Craft: how it will be written (optional)", id: "Teknik: bagaimana tulisan dibuat (opsional)" }
};
var BRIEF = [
  {
    key: "originator",
    group: "agents",
    core: true,
    from: "agents",
    q: { en: "Who is speaking?", id: "Siapa yang berbicara?" },
    why: { en: "The originator starts the communication. Whose voice it is, and why they should be believed, changes how every sentence is read.", id: "Pembuat pesan adalah yang memulai komunikasi. Suara siapa yang dipakai, dan kenapa ia layak dipercaya, mengubah cara setiap kalimat dibaca." },
    how: { en: "Say whose name it goes out under and what gives that voice credibility (experience, role, results).", id: "Sebutkan atas nama siapa tulisan ini keluar dan apa yang membuat suara itu kredibel (pengalaman, peran, hasil)." },
    examples: { en: ["Me, as an Informatics student who builds apps", "Me, on my portfolio blog", "A guest voice: explaining as a tutor would"], id: ["Saya, sebagai mahasiswa Informatika yang membuat aplikasi", "Saya, di blog portofolio saya", "Suara tamu: menjelaskan seperti tutor"] },
    fallback: { en: "You, in your own voice.", id: "Kamu, dengan suaramu sendiri." }
  },
  {
    key: "audience",
    group: "agents",
    core: true,
    from: "agents",
    q: { en: "Who will read it, and do you know them?", id: "Siapa yang akan membaca, dan apakah kamu mengenal mereka?" },
    why: { en: "A real audience is people you know or know of (your class, a lecturer, one client). An anticipated audience is people you hope or expect to reach (followers, strangers who search). It decides what you explain, which words you use and how they may react.", id: "Audiens nyata adalah orang yang kamu kenal atau ketahui (kelasmu, dosen, satu klien). Audiens yang diantisipasi adalah orang yang kamu harap atau perkirakan terjangkau (pengikut, orang asing yang mencari). Ini menentukan apa yang perlu dijelaskan, kata yang dipakai, dan bagaimana reaksi mereka." },
    how: { en: "Name the group, say real or anticipated, what they already know, what they care about, and how they might react.", id: "Sebutkan kelompoknya, nyata atau diantisipasi, apa yang sudah mereka tahu, apa yang mereka pedulikan, dan kemungkinan reaksinya." },
    examples: { en: ["Real: my lecturer and 30 classmates", "Anticipated: Indonesian readers who find my blog through Google", "Anticipated: recruiters checking my portfolio"], id: ["Nyata: dosen dan 30 teman sekelas", "Diantisipasi: pembaca Indonesia yang menemukan blogku lewat Google", "Diantisipasi: rekruter yang melihat portofolioku"] },
    fallback: { en: "No fallback: this one is needed.", id: "Tidak ada bawaan: yang ini wajib." }
  },
  {
    key: "genre",
    group: "conditions",
    core: true,
    from: "conditions",
    q: { en: "What genre or medium?", id: "Genre atau medianya apa?" },
    why: { en: "Genre is the mode you communicate in. Each one has conventions readers expect: length, structure, tone, layout. Breaking them should be a choice, not an accident.", id: "Genre adalah bentuk kamu berkomunikasi. Tiap genre punya konvensi yang diharapkan pembaca: panjang, struktur, nada, tata letak. Melanggarnya harus jadi pilihan, bukan kebetulan." },
    how: { en: "Name the form and where it will appear.", id: "Sebutkan bentuknya dan di mana akan tampil." },
    examples: { en: ["Blog post on my portfolio", "Academic essay for a course", "LinkedIn post", "Technical tutorial with code", "Thread on X", "Presentation script"], id: ["Tulisan blog di portofolioku", "Esai akademik untuk mata kuliah", "Postingan LinkedIn", "Tutorial teknis dengan kode", "Thread di X", "Naskah presentasi"] },
    fallback: { en: "No fallback: this one is needed.", id: "Tidak ada bawaan: yang ini wajib." }
  },
  {
    key: "purpose",
    group: "conditions",
    core: true,
    from: "conditions",
    q: { en: "Why are you writing it?", id: "Kenapa kamu menulisnya?" },
    why: { en: "Purpose is your reason, and there is often more than one: what the text does for the reader (inform, persuade, entertain, reflect, call to action) and what you want from it (a good grade, leads, attention, connection).", id: "Tujuan adalah alasanmu, dan sering lebih dari satu: apa yang dilakukan teks untuk pembaca (memberi info, membujuk, menghibur, merefleksikan, mengajak bertindak) dan apa yang kamu inginkan darinya (nilai bagus, prospek, perhatian, kedekatan)." },
    how: { en: "Pick the main purpose, add a second if there is one, and say what the reader should think, feel or do afterwards.", id: "Pilih tujuan utama, tambahkan tujuan kedua kalau ada, dan sebutkan apa yang harus dipikirkan, dirasakan, atau dilakukan pembaca setelahnya." },
    examples: { en: ["Inform: explain how compound interest works", "Persuade: start using version control early", "Reflect on a project I built, and show recruiters my thinking"], id: ["Memberi info: menjelaskan cara kerja bunga majemuk", "Membujuk: mulai pakai version control sejak awal", "Merefleksikan proyek yang kubuat, sekaligus menunjukkan cara berpikirku ke rekruter"] },
    fallback: { en: "No fallback: this one is needed.", id: "Tidak ada bawaan: yang ini wajib." }
  },
  {
    key: "stance",
    group: "conditions",
    core: true,
    from: "conditions",
    q: { en: "What is your take?", id: "Apa sikap atau pandanganmu?" },
    why: { en: "Stance is your viewpoint as it shows in the text. A clear stance is what makes writing critical instead of ordinary: what are you saying that's new, different, insightful or edgy?", id: "Sikap adalah sudut pandangmu yang tampak di teks. Sikap yang jelas membuat tulisan kritis, bukan biasa: apa yang kamu katakan yang baru, berbeda, tajam, atau berani?" },
    how: { en: "Write it as one sentence. Say how strongly you hold it, and whether the piece should answer the other side.", id: "Tulis dalam satu kalimat. Sebutkan seberapa kuat kamu memegangnya, dan apakah tulisan perlu menjawab pihak yang berseberangan." },
    examples: { en: ["Strong: most \u201CAI will replace programmers\u201D takes ignore what programmers actually do", "Balanced: crypto has real uses, but most coins are speculation", "Neutral explainer, no position"], id: ["Kuat: kebanyakan opini \u201CAI akan menggantikan programmer\u201D mengabaikan apa yang sebenarnya dikerjakan programmer", "Seimbang: kripto punya kegunaan nyata, tapi kebanyakan koin hanya spekulasi", "Penjelasan netral, tanpa posisi"] },
    fallback: { en: "Claude proposes a stance from your discussion and asks you to confirm it.", id: "Claude mengusulkan sikap dari diskusimu lalu memintamu mengonfirmasi." }
  },
  {
    key: "context",
    group: "conditions",
    core: true,
    from: "conditions",
    q: { en: "What is the setting right now?", id: "Apa latar situasinya saat ini?" },
    why: { en: "Context is the setting: the social, political or economic situation and the moment it will be read in. The same post lands differently during a crisis, a holiday or a trending debate.", id: "Konteks adalah latarnya: situasi sosial, politik, atau ekonomi dan momen saat tulisan dibaca. Postingan yang sama terasa berbeda saat krisis, hari raya, atau debat yang sedang ramai." },
    how: { en: "Say when and where it will be read, and what is going on that your audience is already thinking about.", id: "Sebutkan kapan dan di mana dibaca, dan apa yang sedang terjadi yang sudah dipikirkan audiensmu." },
    examples: { en: ["A new AI model was just released", "Interest rates went up", "Right after a viral science myth", "Graduation and job-hunting season"], id: ["Model AI baru saja dirilis", "Suku bunga baru naik", "Tepat setelah mitos sains yang viral", "Musim wisuda dan cari kerja"] },
    fallback: { en: "Today, with nothing special going on.", id: "Hari ini, tanpa peristiwa khusus." }
  },
  {
    key: "culture",
    group: "conditions",
    core: true,
    from: "conditions",
    q: { en: "What does your audience share, and do you share it?", id: "Apa yang dimiliki bersama oleh audiensmu, dan apakah kamu bagian darinya?" },
    why: { en: "Culture is a group that shares values, beliefs or habits. You make assumptions about it when you write. You talk differently to people inside your culture than to people whose views differ from yours.", id: "Budaya adalah kelompok yang berbagi nilai, keyakinan, atau kebiasaan. Kamu membuat asumsi tentangnya saat menulis. Cara bicara ke orang yang sebudaya berbeda dengan ke orang yang pandangannya berbeda darimu." },
    how: { en: "List the values they hold, what would offend or lose them, and whether you are an insider or an outsider.", id: "Sebutkan nilai yang mereka pegang, apa yang bisa menyinggung atau membuat mereka pergi, dan apakah kamu orang dalam atau orang luar." },
    examples: { en: ["Indonesian students: casual, value practical takeaways, skeptical of hype; I\u2019m an insider", "Developers: expect accuracy and code that runs, dislike fluff", "General readers: no jargon, respect for religion and family values"], id: ["Mahasiswa Indonesia: santai, suka manfaat praktis, skeptis pada hype; saya orang dalam", "Developer: mengharapkan akurasi dan kode yang jalan, tidak suka basa-basi", "Pembaca umum: tanpa jargon, menghormati nilai agama dan keluarga"] },
    fallback: { en: "Claude assumes what fits the audience you described and states the assumption.", id: "Claude memakai asumsi yang cocok dengan audiens yang kamu sebutkan dan menyebutkan asumsinya." }
  },
  {
    key: "language",
    group: "craft",
    core: false,
    from: "outcomes",
    q: { en: "Which language and register?", id: "Bahasa dan ragamnya apa?" },
    why: { en: "Conventions are shaped by language too. The same idea reads differently in formal Indonesian, casual Jakarta slang or academic English.", id: "Konvensi juga dibentuk oleh bahasa. Ide yang sama terasa berbeda dalam bahasa Indonesia baku, bahasa gaul Jakarta, atau bahasa Inggris akademik." },
    how: { en: "Pick the language, how formal, and any words to use or avoid.", id: "Pilih bahasanya, seberapa formal, dan kata yang harus dipakai atau dihindari." },
    examples: { en: ["Casual Indonesian (aku/kamu)", "Formal Indonesian (EYD)", "Academic English", "Indonesian with English tech terms"], id: ["Bahasa Indonesia santai (aku/kamu)", "Bahasa Indonesia baku (EYD)", "Bahasa Inggris akademik", "Bahasa Indonesia dengan istilah teknologi berbahasa Inggris"] },
    fallback: { en: "The language you're chatting in, at the register the genre expects.", id: "Bahasa yang kamu pakai saat chat, dengan ragam yang sesuai genre." }
  },
  {
    key: "expectations",
    group: "craft",
    core: false,
    from: "outcomes",
    q: { en: "What must it include to meet expectations?", id: "Apa yang wajib ada supaya sesuai harapan?" },
    why: { en: "Expectation shapes conventions: a rubric, a client brief, a platform limit or a citation style decides what counts as done.", id: "Harapan membentuk konvensi: rubrik, brief klien, batas platform, atau gaya sitasi menentukan kapan tulisan dianggap selesai." },
    how: { en: "Give the length, required parts, deadline format, citation style, or paste the rubric or brief.", id: "Sebutkan panjang, bagian wajib, format, gaya sitasi, atau tempel rubrik atau brief-nya." },
    examples: { en: ["800\u20131000 words, APA 7, 3 sources", "My blog: title \u2264 140 characters, summary \u2264 300, comma-separated tags", "Must include one code example"], id: ["800\u20131000 kata, APA 7, 3 sumber", "Blogku: judul \u2264 140 karakter, ringkasan \u2264 300, tag dipisah koma", "Harus ada satu contoh kode"] },
    fallback: { en: "The usual length and parts of the genre.", id: "Panjang dan bagian yang lazim untuk genre itu." }
  },
  {
    key: "technique",
    group: "craft",
    core: false,
    from: "outcomes",
    q: { en: "Which writing technique and pattern of organization?", id: "Teknik menulis dan pola penyusunannya apa?" },
    why: { en: "The pattern of organization sets up the relationships between ideas: cause and effect, problem and solution, a story arc, a claim with evidence.", id: "Pola penyusunan membangun hubungan antaride: sebab-akibat, masalah-solusi, alur cerita, klaim dengan bukti." },
    how: { en: "Pick one from the technique list, combine two, or let Claude choose and explain why.", id: "Pilih satu dari daftar teknik, gabungkan dua, atau biarkan Claude memilih dan menjelaskan alasannya." },
    examples: { en: ["Storytelling", "PAS (problem, agitate, solve)", "Toulmin argument", "Compare and contrast"], id: ["Storytelling", "PAS (masalah, pertajam, solusi)", "Argumen Toulmin", "Bandingkan dan bedakan"] },
    fallback: { en: "Claude picks the technique that fits the genre and purpose, and says why.", id: "Claude memilih teknik yang cocok dengan genre dan tujuan, lalu menjelaskan alasannya." }
  },
  {
    key: "style",
    group: "craft",
    core: false,
    from: "neuron",
    q: { en: "What style and tone?", id: "Gaya dan nadanya seperti apa?" },
    why: { en: "Two pieces with the same brief can still sound authoritative or friendly, punchy or calm. Tone is where the reader decides whether they like the voice.", id: "Dua tulisan dengan brief sama tetap bisa terdengar berwibawa atau ramah, tajam atau tenang. Dari nada, pembaca memutuskan apakah mereka suka suaranya." },
    how: { en: "Give 2\u20133 adjectives, or paste a sample of writing you want it to sound like.", id: "Berikan 2\u20133 kata sifat, atau tempel contoh tulisan yang ingin ditiru gayanya." },
    examples: { en: ["Direct, practical, a little funny", "Warm and calm", "Confident, short sentences, no jargon"], id: ["Lugas, praktis, sedikit lucu", "Hangat dan tenang", "Percaya diri, kalimat pendek, tanpa jargon"] },
    fallback: { en: "Clear and plain, matched to the audience.", id: "Jelas dan sederhana, disesuaikan dengan audiens." }
  },
  {
    key: "visuals",
    group: "craft",
    core: false,
    from: "outcomes",
    q: { en: "Words only, or with nonverbal elements?", id: "Hanya kata-kata, atau dengan unsur nonverbal?" },
    why: { en: "Verbal and nonverbal elements work together: headings, images, charts, emojis, hashtags, on-screen text, camera shots and layout carry meaning too.", id: "Unsur verbal dan nonverbal bekerja bersama: judul, gambar, grafik, emoji, tagar, teks di layar, shot kamera, dan tata letak juga membawa makna." },
    how: { en: "Say what will appear next to the words, or ask Claude to suggest it.", id: "Sebutkan apa yang akan tampil di samping kata-kata, atau minta Claude menyarankannya." },
    examples: { en: ["Subheadings, one table and a code block", "One diagram and a cover image", "Carousel: 7 slides with a caption", "No emojis"], id: ["Subjudul, satu tabel, dan satu blok kode", "Satu diagram dan gambar sampul", "Carousel: 7 slide dengan caption", "Tanpa emoji"] },
    fallback: { en: "What the genre normally uses.", id: "Yang lazim dipakai genre itu." }
  },
  {
    key: "material",
    group: "craft",
    core: false,
    from: "neuron",
    q: { en: "What should it draw on?", id: "Bahan apa yang dipakai?" },
    why: { en: "Critical writing makes distinctions and draws conclusions that stand up to scrutiny. That needs evidence: your Neuron concepts, your sources, your discussion, or facts that must be checked.", id: "Tulisan kritis membuat pembedaan dan kesimpulan yang tahan diuji. Itu butuh bukti: konsep di Neuron, sumbermu, diskusimu, atau fakta yang harus dicek." },
    how: { en: "Name the concepts or sources, say whether to cite them, and anything it must not claim.", id: "Sebutkan konsep atau sumbernya, apakah perlu dikutip, dan klaim apa yang tidak boleh dibuat." },
    examples: { en: ["Our discussion just now", "My Neuron concepts on this topic, with their sources cited", "Only facts I can link to"], id: ["Diskusi kita barusan", "Konsep Neuron-ku tentang topik ini, dengan sumbernya dikutip", "Hanya fakta yang bisa kutautkan"] },
    fallback: { en: "Your discussion and the matching concepts on your map; your own definitions win.", id: "Diskusimu dan konsep yang cocok di petamu; definisimu sendiri yang dipakai." }
  },
  {
    key: "footprint",
    group: "craft",
    core: false,
    from: "social",
    q: { en: "If it's public: how will it age?", id: "Kalau publik: bagaimana jejaknya nanti?" },
    why: { en: "Every post leaves a digital footprint that may never go away. Ask how it would read to a future employer, client or admissions office.", id: "Setiap postingan meninggalkan jejak digital yang mungkin tidak pernah hilang. Tanyakan bagaimana tulisan ini dibaca oleh calon atasan, klien, atau panitia penerimaan nanti." },
    how: { en: "Say yes, it's public, and anything you don't want tied to your name.", id: "Sebutkan ya, ini publik, dan hal apa yang tidak ingin dikaitkan dengan namamu." },
    examples: { en: ["Public on my portfolio blog: recruiters will read it", "Private, only my lecturer sees it", "Public, but no opinions about my current workplace"], id: ["Publik di blog portofolio: rekruter akan membacanya", "Privat, hanya dosen yang melihat", "Publik, tapi tanpa opini tentang tempat kerjaku sekarang"] },
    fallback: { en: "Claude adds a short footprint check for anything public.", id: "Claude menambahkan cek jejak digital singkat untuk tulisan publik." }
  }
];
var KINDS = {
  story: { en: "Story", id: "Cerita" },
  persuade: { en: "Persuade", id: "Membujuk" },
  argue: { en: "Argue", id: "Berargumen" },
  explain: { en: "Explain and organize", id: "Menjelaskan dan menyusun" },
  reflect: { en: "Reflect", id: "Refleksi" }
};
var TECHNIQUES = [
  { key: "story", kind: "story", name: { en: "Storytelling (three acts)", id: "Storytelling (tiga babak)" }, what: { en: "A character, a problem that grows, a turning point and a resolution.", id: "Tokoh, masalah yang membesar, titik balik, dan penyelesaian." }, best: { en: "Organic content, personal essays, brand stories, speeches", id: "Konten organik, esai pribadi, cerita brand, pidato" }, steps: { en: "Setup \u2192 conflict \u2192 turning point \u2192 resolution \u2192 meaning", id: "Pengenalan \u2192 konflik \u2192 titik balik \u2192 penyelesaian \u2192 makna" } },
  { key: "hso", kind: "story", name: { en: "Hook, story, offer", id: "Hook, cerita, penawaran" }, what: { en: "Stop the scroll, tell a short true story, then make one offer.", id: "Hentikan scroll, ceritakan kisah nyata singkat, lalu satu penawaran." }, best: { en: "Short videos, threads and blog intros", id: "Video pendek, thread, dan pembuka tulisan blog" }, steps: { en: "Hook (first 3 seconds) \u2192 story \u2192 offer and CTA", id: "Hook (3 detik pertama) \u2192 cerita \u2192 penawaran dan CTA" } },
  { key: "aida", kind: "persuade", name: { en: "AIDA", id: "AIDA" }, what: { en: "Attention, interest, desire, action.", id: "Perhatian, minat, keinginan, tindakan." }, best: { en: "Landing pages, project pitches, calls to action", id: "Landing page, pitch proyek, ajakan bertindak" }, steps: { en: "Attention \u2192 interest \u2192 desire \u2192 action", id: "Perhatian \u2192 minat \u2192 keinginan \u2192 tindakan" } },
  { key: "pas", kind: "persuade", name: { en: "PAS", id: "PAS" }, what: { en: "Name the problem, make the pain felt, then solve it.", id: "Sebut masalahnya, buat rasa sakitnya terasa, lalu beri solusi." }, best: { en: "Problem-aware audiences, short scripts", id: "Audiens yang sadar masalah, script pendek" }, steps: { en: "Problem \u2192 agitate \u2192 solve", id: "Masalah \u2192 pertajam \u2192 solusi" } },
  { key: "bab", kind: "persuade", name: { en: "Before, after, bridge", id: "Sebelum, sesudah, jembatan" }, what: { en: "Life now, life after, and how to get there.", id: "Kondisi sekarang, kondisi nanti, dan cara ke sana." }, best: { en: "Testimonials, case studies, transformations", id: "Testimoni, studi kasus, transformasi" }, steps: { en: "Before \u2192 after \u2192 bridge", id: "Sebelum \u2192 sesudah \u2192 jembatan" } },
  { key: "fab", kind: "persuade", name: { en: "Features, advantages, benefits", id: "Fitur, keunggulan, manfaat" }, what: { en: "Turn each spec into what it does and why the reader cares.", id: "Ubah tiap spesifikasi menjadi apa fungsinya dan kenapa pembaca peduli." }, best: { en: "Explaining a tool, library or product to someone choosing one", id: "Menjelaskan alat, library, atau produk ke orang yang sedang memilih" }, steps: { en: "Feature \u2192 advantage \u2192 benefit, for each point", id: "Fitur \u2192 keunggulan \u2192 manfaat, untuk tiap poin" } },
  { key: "appeals", kind: "persuade", name: { en: "Ethos, pathos, logos", id: "Ethos, pathos, logos" }, what: { en: "Balance credibility, emotion and reasoning on purpose.", id: "Seimbangkan kredibilitas, emosi, dan logika dengan sengaja." }, best: { en: "Any persuasive piece; checking a draft", id: "Semua tulisan persuasif; memeriksa draf" }, steps: { en: "Why trust me \u2192 why care \u2192 why it's true", id: "Kenapa percaya saya \u2192 kenapa peduli \u2192 kenapa benar" } },
  { key: "cer", kind: "argue", name: { en: "Claim, evidence, reasoning", id: "Klaim, bukti, penalaran" }, what: { en: "State the claim, show evidence, explain why the evidence proves it.", id: "Nyatakan klaim, tunjukkan bukti, jelaskan kenapa bukti itu membuktikannya." }, best: { en: "Short academic answers, opinion posts", id: "Jawaban akademik singkat, postingan opini" }, steps: { en: "Claim \u2192 evidence \u2192 reasoning", id: "Klaim \u2192 bukti \u2192 penalaran" } },
  { key: "toulmin", kind: "argue", name: { en: "Toulmin argument", id: "Argumen Toulmin" }, what: { en: "Adds the hidden assumption and answers the strongest objection.", id: "Menambahkan asumsi tersembunyi dan menjawab keberatan terkuat." }, best: { en: "Essays where readers will push back", id: "Esai yang akan dibantah pembaca" }, steps: { en: "Claim \u2192 grounds \u2192 warrant \u2192 backing \u2192 qualifier \u2192 rebuttal", id: "Klaim \u2192 dasar \u2192 jaminan \u2192 dukungan \u2192 batasan \u2192 sanggahan" } },
  { key: "rogerian", kind: "argue", name: { en: "Rogerian argument", id: "Argumen Rogerian" }, what: { en: "Start from common ground and the other side's view before your own.", id: "Mulai dari kesamaan dan pandangan pihak lain sebelum pandanganmu." }, best: { en: "Audiences outside your culture or who disagree", id: "Audiens di luar budayamu atau yang tidak setuju" }, steps: { en: "Their view, fairly \u2192 where it's right \u2192 your view \u2192 shared solution", id: "Pandangan mereka, secara adil \u2192 bagian yang benar \u2192 pandanganmu \u2192 solusi bersama" } },
  { key: "classical", kind: "argue", name: { en: "Classical argument", id: "Argumen klasik" }, what: { en: "The five-part structure from Greek and Roman rhetoric.", id: "Struktur lima bagian dari retorika Yunani dan Romawi." }, best: { en: "Formal essays, debates, speeches", id: "Esai formal, debat, pidato" }, steps: { en: "Introduction \u2192 background \u2192 your case \u2192 refutation \u2192 conclusion", id: "Pembuka \u2192 latar \u2192 argumenmu \u2192 sanggahan \u2192 kesimpulan" } },
  { key: "peel", kind: "explain", name: { en: "PEEL paragraphs", id: "Paragraf PEEL" }, what: { en: "Each paragraph: point, evidence, explanation, link back.", id: "Tiap paragraf: poin, bukti, penjelasan, kaitan balik." }, best: { en: "Academic essays and reports", id: "Esai akademik dan laporan" }, steps: { en: "Point \u2192 evidence \u2192 explain \u2192 link", id: "Poin \u2192 bukti \u2192 jelaskan \u2192 kaitkan" } },
  { key: "pyramid", kind: "explain", name: { en: "Inverted pyramid", id: "Piramida terbalik" }, what: { en: "Most important facts first, details after.", id: "Fakta terpenting dulu, rincian sesudahnya." }, best: { en: "News, announcements, busy readers", id: "Berita, pengumuman, pembaca sibuk" }, steps: { en: "Who, what, when, where, why \u2192 key details \u2192 background", id: "Siapa, apa, kapan, di mana, kenapa \u2192 rincian penting \u2192 latar" } },
  { key: "compare", kind: "explain", name: { en: "Compare and contrast", id: "Bandingkan dan bedakan" }, what: { en: "Line two things up on the same points.", id: "Sejajarkan dua hal pada poin yang sama." }, best: { en: "Reviews, buying guides, analysis", id: "Ulasan, panduan membeli, analisis" }, steps: { en: "Point by point, or one subject then the other \u2192 verdict", id: "Poin per poin, atau satu subjek lalu yang lain \u2192 kesimpulan" } },
  { key: "cause", kind: "explain", name: { en: "Cause and effect", id: "Sebab dan akibat" }, what: { en: "Trace why something happens and what follows.", id: "Telusuri kenapa sesuatu terjadi dan apa dampaknya." }, best: { en: "Explainers, analysis, problem awareness", id: "Penjelasan, analisis, menyadarkan masalah" }, steps: { en: "Cause \u2192 chain \u2192 effect \u2192 what to do", id: "Sebab \u2192 rantai \u2192 akibat \u2192 yang perlu dilakukan" } },
  { key: "problem", kind: "explain", name: { en: "Problem and solution", id: "Masalah dan solusi" }, what: { en: "Define a problem, weigh options, recommend one.", id: "Definisikan masalah, timbang pilihan, rekomendasikan satu." }, best: { en: "Proposals, reports, case studies of projects", id: "Proposal, laporan, studi kasus proyek" }, steps: { en: "Problem \u2192 options \u2192 best option \u2192 next step", id: "Masalah \u2192 pilihan \u2192 pilihan terbaik \u2192 langkah berikutnya" } },
  { key: "process", kind: "explain", name: { en: "Process (how-to)", id: "Proses (cara)" }, what: { en: "Numbered steps in the order they are done.", id: "Langkah bernomor sesuai urutan." }, best: { en: "Tutorials, SOPs, educational content", id: "Tutorial, SOP, konten edukasi" }, steps: { en: "Goal \u2192 what you need \u2192 steps \u2192 check", id: "Tujuan \u2192 yang dibutuhkan \u2192 langkah \u2192 cek" } },
  { key: "feynman", kind: "explain", name: { en: "Feynman explanation", id: "Penjelasan Feynman" }, what: { en: "Explain it simply with one example, then name the gap.", id: "Jelaskan dengan sederhana dan satu contoh, lalu sebut celahnya." }, best: { en: "Study notes, teaching, explainers", id: "Catatan belajar, mengajar, penjelasan" }, steps: { en: "Plain explanation \u2192 example \u2192 where it breaks \u2192 refine", id: "Penjelasan sederhana \u2192 contoh \u2192 di mana tidak berlaku \u2192 perbaiki" } },
  { key: "listicle", kind: "explain", name: { en: "Listicle", id: "Listicle" }, what: { en: "A numbered list of parallel points under one promise.", id: "Daftar bernomor berisi poin sejajar di bawah satu janji." }, best: { en: "Carousels, blogs, skimmable posts", id: "Carousel, blog, postingan yang mudah dipindai" }, steps: { en: "Promise \u2192 points \u2192 wrap-up", id: "Janji \u2192 poin-poin \u2192 penutup" } },
  { key: "whatsowhat", kind: "reflect", name: { en: "What, so what, now what", id: "Apa, lalu kenapa, lalu apa" }, what: { en: "What happened, why it matters, what you'll do next.", id: "Apa yang terjadi, kenapa penting, apa yang akan dilakukan." }, best: { en: "Reflections, learning journals, post-mortems", id: "Refleksi, jurnal belajar, evaluasi" }, steps: { en: "What \u2192 so what \u2192 now what", id: "Apa \u2192 lalu kenapa \u2192 lalu apa" } },
  { key: "gibbs", kind: "reflect", name: { en: "Gibbs reflective cycle", id: "Siklus reflektif Gibbs" }, what: { en: "A fuller six-step reflection.", id: "Refleksi enam langkah yang lebih lengkap." }, best: { en: "Academic reflective essays", id: "Esai reflektif akademik" }, steps: { en: "Description \u2192 feelings \u2192 evaluation \u2192 analysis \u2192 conclusion \u2192 action plan", id: "Deskripsi \u2192 perasaan \u2192 evaluasi \u2192 analisis \u2192 kesimpulan \u2192 rencana aksi" } }
];
var WORKFLOW = [
  "1. Read the topic. If it touches the user's map, use neuron_search or neuron_read_concept first, so you can suggest material.",
  "2. Ask the brief in ONE message: the 7 core questions numbered (agents, then the five conditions), then the optional craft questions in a short list. For each question give: the question, one line on how to answer, and 2-3 short examples in the user's language. Say they can answer briefly, skip optional ones, or reply 'you choose' for any of them.",
  "3. If the request already answers some questions, fill them in and ask the user to confirm instead of asking again.",
  "4. Don't write until the core answers are in, unless the user says to just write. For 'you choose', use the fallback and say what you chose. If two answers clash (e.g. a formal genre with slang), ask one follow-up.",
  "5. Before writing, restate the brief in 3-5 lines and name the technique you'll use and why it fits.",
  "6. Write the piece. After it, add short 'Rhetorical notes': how it fits the audience, purpose, genre conventions and culture, and a digital footprint check if it's public.",
  "7. Offer to save it. Only after the user agrees, call neuron_save_writing with the brief. To save a revision, pass the same id."
];
function blogPreset(p, b) {
  return {
    originator: `${p.name}: ${p.about}`,
    audience: `Anticipated: ${b.audience}`,
    genre: `Blog post on ${b.name}${b.url ? ` (${b.url}${b.section})` : ` (${b.section})`}`,
    language: b.lang === "id" ? "Indonesian, natural and clear (not stiff EYD), English terms kept where readers know them" : "English, plain and clear",
    expectations: b.format,
    style: b.voice,
    visuals: "Subheadings (##), short paragraphs; a table, list or code block where it helps; optional cover image 1200\xD7630",
    material: "My research in Neuron (concepts, sources, notes), cited with links; anything not from my sources must be checked and cited",
    footprint: "Public on my portfolio: recruiters and clients may read it"
  };
}
var BLOG_STEPS = [
  "1. Call neuron_research_pack with the topic. Tell the user in 3-6 bullets what their map already has (concepts, their definitions, sources, notes) and what is missing.",
  "2. If something important is missing, offer to research it (web search if you have it). Keep every fact with its source and link. Never present your own knowledge as the user's research.",
  "3. Run the brief from neuron_writing_guide. The 'prefilled' answers come from the user's Settings: show them as one short list to confirm or change, and ask only the open core questions (purpose, stance, context, culture) with guidance and examples.",
  "4. Propose an angle and an outline (title, 4-6 ## sections, the technique) and wait for an OK.",
  "5. Write the post in Markdown following blog_format exactly: no HTML, start with ## subheadings (the page shows the title), short paragraphs, links as [text](https://...). End with a '## Sumber' (Indonesian) or '## Sources' section listing every source with its link.",
  "6. Also write: a title (max 140 characters), a slug (lowercase-words-with-hyphens, max 80), a ringkasan/excerpt (max 300 characters, makes people click), 3-6 comma-separated tags, and an optional cover image idea.",
  "7. Add short Rhetorical notes and a digital footprint check. Offer to save; on OK call neuron_save_writing with brief, post (slug, excerpt, tags, cover_url, sources) and the concepts used. Tell the user it's in Neuron \u2192 Writing, ready to copy field by field into their blog admin."
];

// mcp/server.ts
var SERVER = { name: "neuron", version: "0.7.0" };
var SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];
var INSTRUCTIONS = `Neuron is the user's personal knowledge map: concepts from what they read, linked across topics, with mastery scores, spaced review and a glossary. The user is Indonesian and learns in English and Indonesian; reply in the language they use. neuron_overview tells you who they are (name, background, interests): take your examples from their interests.
- The user's own definitions and glossary terms are the source of truth. Prefer them over your own knowledge and say when they differ.
- Start with neuron_overview to see domains and what's due. Use neuron_read_concept before explaining or quizzing a concept.
- To quiz: ask one question at a time, ask how sure they are (guess, fair, sure), then call neuron_record_result. Never record a result the user didn't give.
- To add something they read: read it, extract 3 to 7 concepts yourself (reuse existing ids and domain keys from neuron_list_concepts), then call neuron_add_source. Summaries must come only from the text.
- Links you create are suggestions; the user approves them in the app. Ask before changing definitions.
- To write anything for the user (essay, post, script, email, report...): call neuron_writing_guide first and ask its rhetorical-situation brief (who is speaking, audience, genre, purpose, stance, context, culture, then optional craft questions), each with how-to-answer guidance and examples. Don't write before the core answers are in unless the user says so. Then offer neuron_save_writing.
- When the user wants to learn or understand something ("teach me", "I want to understand\u2026", "explain \u2026 so I really get it"): run a lesson. Call neuron_lesson_start and follow its steps: probe what they know, plan, then teach one step at a time with a prediction, a clear explanation (mermaid flowcharts, LaTeX equations, svg figures, tables where they help) and a check. Save every step with neuron_lesson_step so the lesson appears in the app.
- To turn their research into a blog post: follow the steps from neuron_writing_guide with preset 'blog' (start with neuron_research_pack). Their Settings prefill most of the brief; confirm it with them instead of asking everything again.
- When the user asks to save, input or keep the result of a discussion: draft a note (summary, key points, their conclusions, open questions, next steps, concepts), show it, and call neuron_save_discussion after they approve. Keep what the user said apart from what you suggested. Then offer to save their definitions, new terms or new concepts with the other tools.`;
var cache = null;
var graph = () => cache = getGraph();
function find(g2, q) {
  const s = String(q ?? "").trim().toLowerCase();
  const c = g2.concepts.find((x) => x.id === s) || g2.concepts.find((x) => x.label.en.toLowerCase() === s || x.label.id.toLowerCase() === s) || g2.concepts.find((x) => x.label.en.toLowerCase().includes(s) || x.label.id.toLowerCase().includes(s));
  if (!c) throw new Error(`No concept matches "${q}". Use neuron_list_concepts to see ids.`);
  return c;
}
var dname = (g2, k) => g2.domains.find((d) => d.key === k)?.name.en || k;
var brief = (g2, c) => ({ id: c.id, label_en: c.label.en, label_id: c.label.id, domains: c.domains.map((k) => dname(g2, k)), mastery: c.mastery, misconception: c.miscon, due_for_review: c.miscon || (c.review ? c.review.due <= Date.now() : c.mastery < 60) });
var iso = (t) => t ? new Date(t).toISOString() : null;
var CONF = ["guess", "fair", "sure"];
function conceptIds(list) {
  const g2 = graph(), ids = [], unknown = [];
  for (const x of Array.isArray(list) ? list : []) {
    try {
      ids.push(find(g2, x).id);
    } catch {
      unknown.push(String(x));
    }
  }
  return { ids, unknown };
}
var str = { type: "string" };
var TOOLS = [
  {
    name: "neuron_overview",
    description: "Summary of the map: domains, counts, mastery, what's due for review, weakest concepts, confidence calibration and the glossary size.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    run: () => {
      const g2 = graph(), d = due(g2.concepts), k = g2.calibration;
      return {
        concepts: g2.concepts.length,
        domains: g2.domains.map((x) => ({ key: x.key, en: x.name.en, id: x.name.id, concepts: g2.concepts.filter((c) => c.domains.includes(x.key)).length })),
        average_mastery: g2.concepts.length ? Math.round(g2.concepts.reduce((s, c) => s + c.mastery, 0) / g2.concepts.length) : 0,
        due_now: d.slice(0, 10).map((c) => brief(g2, c)),
        due_count: d.length,
        coming_up: upcoming(g2.concepts).slice(0, 5).map((c) => ({ id: c.id, label: c.label.en, due: iso(c.review?.due) })),
        misconceptions: g2.concepts.filter((c) => c.miscon).map((c) => c.id),
        calibration: { certain_answers: k.sure.n, certain_right_pct: k.sure.n ? Math.round(k.sure.right / k.sure.n * 100) : null },
        suggested_links_waiting: g2.links.filter((l) => l.status === "suggested").length,
        glossary_terms: g2.glossary.length,
        language: g2.prefs.lang,
        learner: g2.profile,
        blog: { name: g2.blog.name, url: g2.blog.url || null, language: g2.blog.lang },
        saved_writing: listWritings().length
      };
    }
  },
  {
    name: "neuron_list_concepts",
    description: "List concepts with id, labels, domains and mastery. Filter by domain key, text, or only those due for review.",
    inputSchema: { type: "object", properties: { domain: { ...str, description: "Domain key" }, query: { ...str, description: "Words to match in the labels" }, due_only: { type: "boolean" } } },
    annotations: { readOnlyHint: true },
    run: (a) => {
      const g2 = graph(), q = String(a.query || "").toLowerCase();
      let list = g2.concepts;
      if (a.domain) list = list.filter((c) => c.domains.includes(String(a.domain)));
      if (q) list = list.filter((c) => `${c.id} ${c.label.en} ${c.label.id}`.toLowerCase().includes(q));
      if (a.due_only) {
        const d = new Set(due(g2.concepts).map((c) => c.id));
        list = list.filter((c) => d.has(c.id));
      }
      return { count: list.length, concepts: list.map((c) => brief(g2, c)), domain_keys: g2.domains.map((d) => d.key) };
    }
  },
  {
    name: "neuron_read_concept",
    description: "Everything about one concept: summaries in English and Indonesian, the user's definition (authoritative), sources with quotes, terms, links, mastery, review schedule and stored quiz questions.",
    inputSchema: { type: "object", properties: { concept: { ...str, description: "Concept id or label" } }, required: ["concept"] },
    annotations: { readOnlyHint: true },
    run: (a) => {
      const g2 = graph(), c = find(g2, a.concept), lab = (id) => g2.concepts.find((x) => x.id === id)?.label.en || id;
      return {
        ...brief(g2, c),
        summary_en: c.summary.en,
        summary_id: c.summary.id,
        user_definition: c.userDef,
        sources: c.sources.map((s) => ({ title: s.title, note: s.note, quote: s.quote, page: s.page })),
        terms: c.vocab.map((v) => ({ en: v.en, id: v.ind, example: v.ex })),
        links: g2.links.filter((l) => l.from === c.id || l.to === c.id).map((l) => ({ text: `${lab(l.from)} ${TYPES[l.type].say.en} ${lab(l.to)}`, from: l.from, to: l.to, type: l.type, status: l.status })),
        review: c.review ? { next: iso(c.review.due), reviews: c.review.reps, forgotten: c.review.lapses, memory_strength_days: c.review.stability } : null,
        questions: c.quiz.map((q) => ({ question: q.q.en, question_id: q.q.id, options: q.o.map((o) => o.en), answer_index: q.a, why: q.why.en })),
        glossary: g2.glossary
      };
    }
  },
  {
    name: "neuron_search",
    description: "Search concepts and source passages. Uses meaning when the app has a search model set, otherwise word matching.",
    inputSchema: { type: "object", properties: { query: str }, required: ["query"] },
    annotations: { readOnlyHint: true },
    run: async (a) => {
      const g2 = graph(), r = await search(String(a.query), 8);
      return { by_meaning: r.semantic, concepts: r.concepts.map((h) => ({ ...brief(g2, find(g2, h.id)), score: Math.round(h.score * 100) / 100 })), passages: r.passages.map((p) => ({ source: p.sourceTitle, page: p.page, text: (p.text || "").slice(0, 700) })) };
    }
  },
  {
    name: "neuron_record_result",
    description: "Record the user's answer to a question you asked, with how sure they were. Updates mastery, misconception flag and the spaced-review schedule exactly like the app. kind 'quiz' needs correct; kind 'essay' needs score 0-100.",
    inputSchema: { type: "object", properties: { concept: str, kind: { type: "string", enum: ["quiz", "essay"] }, correct: { type: "boolean" }, score: { type: "number" }, confidence: { type: "string", enum: CONF }, note: { ...str, description: "Short note: the question and their answer" } }, required: ["concept", "kind", "confidence"] },
    run: (a) => {
      const g2 = graph(), c = find(g2, a.concept);
      if (!CONF.includes(a.confidence)) throw new Error("confidence must be guess, fair or sure");
      if (a.kind === "quiz" && typeof a.correct !== "boolean") throw new Error("quiz results need correct: true or false");
      if (a.kind === "essay" && typeof a.score !== "number") throw new Error("essay results need a score from 0 to 100");
      const r = recordExternal(c.id, { kind: a.kind, correct: a.correct, score: a.score, confidence: a.confidence, note: a.note ? String(a.note).slice(0, 300) : void 0 });
      return { concept: c.label.en, right: r.right, mastery_change: r.delta, mastery_now: r.mastery, next_review: iso(r.nextReview) };
    }
  },
  {
    name: "neuron_set_definition",
    description: "Save the user's own definition of a concept (it becomes the source of truth for all AI in the app). Only call when the user gave or approved the wording. Empty text removes it.",
    inputSchema: { type: "object", properties: { concept: str, definition: str }, required: ["concept", "definition"] },
    run: (a) => {
      const g2 = graph(), c = find(g2, a.concept);
      setDefinition(c.id, String(a.definition));
      return { saved: true, concept: c.label.en };
    }
  },
  {
    name: "neuron_add_glossary",
    description: "Add or update a glossary term the user defined. Glossary terms are treated as authoritative everywhere in the app.",
    inputSchema: { type: "object", properties: { term: str, definition: str }, required: ["term", "definition"] },
    run: (a) => {
      upsertGlossary(String(a.term), String(a.definition));
      return { saved: true };
    }
  },
  {
    name: "neuron_suggest_link",
    description: "Suggest a link between two concepts. It appears as a blue dashed suggestion the user approves or rejects in the app.",
    inputSchema: { type: "object", properties: { from: str, to: str, type: { type: "string", enum: LINK_TYPES }, why_en: str, why_id: str }, required: ["from", "to", "type", "why_en"] },
    run: (a) => {
      const g2 = graph(), f = find(g2, a.from), t = find(g2, a.to);
      if (!LINK_TYPES.includes(a.type)) throw new Error(`type must be one of ${LINK_TYPES.join(", ")}`);
      const lid = addLink(f.id, t.id, a.type, "suggested", { en: String(a.why_en), id: String(a.why_id || a.why_en) });
      return lid ? { suggested: `${f.label.en} ${TYPES[a.type].say.en} ${t.label.en}` } : { suggested: false, reason: "These two are already linked." };
    }
  },
  {
    name: "neuron_add_question",
    description: "Store a multiple-choice question (exactly 4 options) on a concept so the user can practise it in the app. Give Indonesian versions when you can.",
    inputSchema: { type: "object", properties: { concept: str, question_en: str, question_id: str, options_en: { type: "array", items: str, minItems: 4, maxItems: 4 }, options_id: { type: "array", items: str }, answer_index: { type: "integer", minimum: 0, maximum: 3 }, why_en: str, why_id: str }, required: ["concept", "question_en", "options_en", "answer_index", "why_en"] },
    run: (a) => {
      const g2 = graph(), c = find(g2, a.concept);
      if (!Array.isArray(a.options_en) || a.options_en.length !== 4) throw new Error("Give exactly 4 options");
      const oid = Array.isArray(a.options_id) && a.options_id.length === 4 ? a.options_id : a.options_en;
      const qid = addMcq(c.id, { q: { en: String(a.question_en), id: String(a.question_id || a.question_en) }, o: a.options_en.map((o, i) => ({ en: String(o), id: String(oid[i]) })), a: Number(a.answer_index), why: { en: String(a.why_en), id: String(a.why_id || a.why_en) } }, null);
      return { saved: true, question_id: qid };
    }
  },
  {
    name: "neuron_add_source",
    description: "Add something the user read, with the concepts YOU extracted from it (no API cost in the app). Reuse existing concept ids (existing_id) and domain keys; new concepts are merged automatically when the label matches. Links are added as suggestions.",
    inputSchema: {
      type: "object",
      required: ["title", "text", "concepts"],
      properties: {
        title: str,
        text: { ...str, description: "The source text (or the part the concepts come from)" },
        new_domains: { type: "array", items: { type: "object", properties: { key: str, en: str, id: str }, required: ["key", "en", "id"] } },
        concepts: { type: "array", items: { type: "object", required: ["label_en", "summary_en", "domains"], properties: {
          key: { ...str, description: "Short key you use in links" },
          existing_id: { ...str, description: "Id of an existing concept that is the same idea" },
          label_en: str,
          label_id: str,
          summary_en: str,
          summary_id: str,
          domains: { type: "array", items: str, description: "Domain keys" },
          source_note: str,
          quote: { ...str, description: "One sentence copied word for word from the text" },
          vocab: { type: "array", items: { type: "object", properties: { en: str, id: str, ex: str } } }
        } } },
        links: { type: "array", items: { type: "object", required: ["from", "to", "type"], properties: { from: str, to: str, type: { type: "string", enum: LINK_TYPES }, why_en: str, why_id: str } } },
        unknown_terms: { type: "array", items: str }
      }
    },
    run: async (a) => {
      const text2 = String(a.text || "").trim();
      if (text2.split(/\s+/).length < 10) throw new Error("Include the source text (at least a few sentences).");
      const report = applyImport(String(a.title || "Untitled source"), text2, { new_domains: a.new_domains, concepts: a.concepts, links: a.links, unknown_terms: a.unknown_terms }, { kind: "text" });
      await indexAfterImport(report.sourceId);
      return { added: report.added, merged: report.merged, new_domains: report.domains, suggested_links: report.links.length, note: "Shown in the app as the latest import; the user approves the links there." };
    }
  },
  {
    name: "neuron_lesson_start",
    description: "Start a 'Teach me' lesson toward a learning goal. Returns the lesson id, what the learner's map already has on the goal (concepts with mastery and their prerequisites), the learner profile, the teaching method to follow and the format guide for diagrams and equations. Call it first whenever the user wants to learn or understand something.",
    inputSchema: { type: "object", properties: { goal: { ...str, description: "What the learner wants to understand or be able to do, in their words" }, lang: { type: "string", enum: ["en", "id"] } }, required: ["goal"] },
    run: async (a) => {
      const g2 = graph(), goal = String(a.goal).trim();
      if (!goal) throw new Error("Give the learning goal.");
      const id = createLesson(goal, a.lang || g2.prefs.lang);
      const r = await search(goal, 6);
      const hits = r.concepts.map((h) => g2.concepts.find((c) => c.id === h.id)).filter(Boolean);
      const lab = (cid) => g2.concepts.find((x) => x.id === cid)?.label.en || cid;
      const lvl = (c) => level(c.mastery);
      return {
        lesson_id: id,
        goal,
        learner: g2.profile,
        on_the_map: hits.map((c) => ({
          id: c.id,
          label: c.label.en,
          mastery: c.mastery,
          level: lvl(c),
          misconception: c.miscon,
          user_definition: c.userDef || null,
          summary: c.summary.en,
          needs_first: chainBack(g2.links, c.id).map((p) => ({ id: p.id, label: lab(p.id), mastery: g2.concepts.find((x) => x.id === p.id)?.mastery ?? null }))
        })),
        passages: r.passages.slice(0, 4).map((p) => ({ source: p.sourceTitle, page: p.page, text: (p.text || "").slice(0, 600) })),
        glossary: g2.glossary,
        steps: TEACH_STEPS,
        format: FORMAT_GUIDE,
        note: hits.length ? "Start with the probe. Their own definitions win over your knowledge." : "Nothing on the map matches yet: probe from scratch, and offer to add the new ideas to the map at the end."
      };
    }
  },
  {
    name: "neuron_lesson_plan",
    description: "Save what the probe found and the lesson plan (ordered steps from the gaps to the goal). Call after probing, before teaching. Can be called again to change the plan.",
    inputSchema: {
      type: "object",
      required: ["lesson_id", "start_summary", "steps"],
      properties: {
        lesson_id: { type: "integer" },
        start_summary: { ...str, description: "2-3 sentences: what they already understand, what's missing, any misconception" },
        probe: { type: "array", items: { type: "object", required: ["question", "answer", "verdict"], properties: { concept: str, question: str, answer: { ...str, description: "What the learner said, briefly" }, verdict: { type: "string", enum: ["knows", "partly", "gap", "misconception"] }, confidence: { type: "string", enum: CONF }, note: str } } },
        steps: { type: "array", minItems: 1, maxItems: 12, items: { type: "object", required: ["title"], properties: { title: str, concept: { ...str, description: "Existing concept id or label, if the step is about one" }, why: { ...str, description: "Why this step comes here" } } } }
      }
    },
    run: (a) => {
      const l = getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}. Start one with neuron_lesson_start.`);
      const g2 = graph();
      const cid = (x) => {
        if (!x) return null;
        try {
          return find(g2, x).id;
        } catch {
          return null;
        }
      };
      const old = new Map(l.steps.map((s) => [s.title, s]));
      l.steps = a.steps.map((s) => old.get(String(s.title)) || { title: String(s.title).slice(0, 160), concept: cid(s.concept), why: s.why ? String(s.why) : void 0, status: "todo" });
      l.startSummary = String(a.start_summary);
      if (Array.isArray(a.probe)) l.probe = a.probe.map((p) => ({ concept: cid(p.concept), question: String(p.question), answer: String(p.answer), verdict: p.verdict, confidence: CONF.includes(p.confidence) ? p.confidence : null, note: p.note ? String(p.note) : void 0 }));
      l.status = "active";
      l.current = Math.min(l.current, l.steps.length - 1);
      saveLesson(l);
      return { saved: true, lesson_id: l.id, steps: l.steps.map((s, i) => ({ step: i + 1, title: s.title, concept: s.concept })), note: "Now teach step 1: predict, explain, check, then neuron_lesson_step." };
    }
  },
  {
    name: "neuron_lesson_step",
    description: "Save one taught step: the prediction question and the learner's guess, the explanation exactly as shown (Markdown with ```mermaid flowcharts, $LaTeX$ math, ```svg figures, tables), the check question, and the learner's result. Saving a result also updates mastery and spaced review for the step's concept. Call once per step, or again to add the result after they answer.",
    inputSchema: {
      type: "object",
      required: ["lesson_id", "step"],
      properties: {
        lesson_id: { type: "integer" },
        step: { type: "integer", minimum: 1, description: "Step number, starting at 1" },
        predict: { ...str, description: "The question you asked before explaining" },
        prediction: { ...str, description: "What the learner guessed" },
        explanation: { ...str, description: "The explanation in Markdown, including diagrams and math" },
        check: { type: "object", required: ["question"], properties: { question: str, options: { type: "array", items: str, maxItems: 6 }, answer_index: { type: "integer", minimum: 0 }, why: str } },
        result: { type: "object", required: ["correct", "confidence"], properties: { correct: { type: "boolean" }, confidence: { type: "string", enum: CONF }, answer: { ...str, description: "What the learner answered" }, misconception: { ...str, description: "The confusion behind a wrong answer, in one sentence" }, feedback: str } }
      }
    },
    run: (a) => {
      const l = getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}.`);
      const i = Number(a.step) - 1, s = l.steps[i];
      if (!s) throw new Error(`Lesson ${l.id} has ${l.steps.length} steps; there is no step ${a.step}. Use neuron_lesson_plan to change the plan.`);
      if (a.predict) s.predict = String(a.predict);
      if (a.prediction) s.prediction = String(a.prediction);
      if (a.explanation) s.explanation = String(a.explanation);
      if (a.check?.question) s.check = { question: String(a.check.question), ...Array.isArray(a.check.options) ? { options: a.check.options.map(String) } : {}, ...typeof a.check.answer_index === "number" ? { answer_index: a.check.answer_index } : {}, ...a.check.why ? { why: String(a.check.why) } : {} };
      if (s.status === "todo") s.status = "teaching";
      l.current = Math.max(l.current, i);
      saveLesson(l);
      let mastery = null;
      if (a.result && typeof a.result.correct === "boolean") {
        if (!CONF.includes(a.result.confidence)) throw new Error("result.confidence must be guess, fair or sure");
        const r = answerLessonCheck(l.id, i, { correct: a.result.correct, confidence: a.result.confidence, answer: a.result.answer ? String(a.result.answer) : void 0, misconception: a.result.misconception ? String(a.result.misconception) : void 0, feedback: a.result.feedback ? String(a.result.feedback) : void 0, by: "claude" });
        mastery = r.mastery ? { concept: s.concept, change: r.mastery.delta, now: r.mastery.mastery } : null;
      }
      const fresh = getLesson(l.id);
      return { saved: true, step: i + 1, of: fresh.steps.length, status: fresh.steps[i].status, mastery, next_step: fresh.current + 1, note: fresh.steps[i].status === "needs_review" ? "Wrong answer saved. Give the smallest hint, let them retry, then save the new result." : "Saved. It's visible in Neuron \u2192 Lessons." };
    }
  },
  {
    name: "neuron_lesson_finish",
    description: "Close a lesson with a summary of what the learner now understands, what's still shaky, and next steps.",
    inputSchema: { type: "object", required: ["lesson_id", "summary"], properties: { lesson_id: { type: "integer" }, summary: str, next: { type: "array", items: str, maxItems: 5 } } },
    run: (a) => {
      const l = getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}.`);
      l.summary = String(a.summary);
      l.next = Array.isArray(a.next) ? a.next.map(String) : [];
      l.status = "done";
      saveLesson(l);
      return { saved: true, passed: l.steps.filter((s) => s.status === "passed").length, steps: l.steps.length };
    }
  },
  {
    name: "neuron_lesson_get",
    description: "Read a lesson (or list lessons if no id) so you can continue where it stopped.",
    inputSchema: { type: "object", properties: { lesson_id: { type: "integer" } } },
    annotations: { readOnlyHint: true },
    run: (a) => {
      if (!a.lesson_id) return { lessons: listLessons().slice(0, 20).map((l2) => ({ id: l2.id, goal: l2.goal, status: l2.status, progress: `${l2.steps.filter((s) => s.status === "passed").length}/${l2.steps.length}`, updated: iso(l2.updatedAt) })) };
      const l = getLesson(Number(a.lesson_id));
      if (!l) throw new Error(`No lesson ${a.lesson_id}.`);
      return { ...l, steps: l.steps.map((s, i) => ({ step: i + 1, ...s, explanation: s.explanation ? s.explanation.slice(0, 1500) : void 0 })), format: FORMAT_GUIDE, method: TEACH_STEPS };
    }
  },
  {
    name: "neuron_research_pack",
    description: "Gather everything the user's Neuron has on a topic, ready to write from: matching concepts with their definitions, summaries, sources and quotes, the links between them, relevant source passages, glossary terms and saved notes. Use it first when turning research into a blog post or essay.",
    inputSchema: { type: "object", properties: { topic: { ...str, description: "The topic or question" }, max_concepts: { type: "integer", minimum: 1, maximum: 15 } }, required: ["topic"] },
    annotations: { readOnlyHint: true },
    run: async (a) => {
      const g2 = graph(), topic = String(a.topic), max = Math.min(15, Number(a.max_concepts) || 8);
      const r = await search(topic, max);
      const found = r.concepts.map((h) => g2.concepts.find((c) => c.id === h.id)).filter(Boolean);
      const ids = new Set(found.map((c) => c.id));
      const lab = (id) => g2.concepts.find((x) => x.id === id)?.label.en || id;
      const words = topic.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const notes = listWritings().filter((w) => w.conceptIds.some((id) => ids.has(id)) || words.some((w2) => `${w.title} ${w.body}`.toLowerCase().includes(w2))).slice(0, 6);
      return {
        topic,
        search_by_meaning: r.semantic,
        concepts: found.map((c) => ({
          id: c.id,
          label: c.label.en,
          label_id: c.label.id,
          domains: c.domains.map((k) => dname(g2, k)),
          user_definition: c.userDef || null,
          summary: c.summary.en,
          summary_id: c.summary.id,
          mastery: c.mastery,
          sources: c.sources.map((s) => ({ title: s.title, note: s.note || null, quote: s.quote || null, page: s.page || null })),
          terms: c.vocab.map((v) => `${v.en} (${v.ind})`)
        })),
        links: g2.links.filter((l) => l.status === "approved" && ids.has(l.from) && ids.has(l.to)).map((l) => `${lab(l.from)} ${TYPES[l.type].say.en} ${lab(l.to)}`),
        passages: r.passages.map((p) => ({ source: p.sourceTitle, page: p.page, text: (p.text || "").slice(0, 900) })),
        glossary: g2.glossary.filter((x) => words.some((w) => `${x.term} ${x.definition}`.toLowerCase().includes(w))),
        saved_notes: notes.map((w) => ({ id: w.id, kind: w.kind, title: w.title, text: w.body.slice(0, 1200) })),
        coverage: found.length ? `${found.length} concepts and ${r.passages.length} passages found. Say what is covered and what is missing before writing.` : "Nothing on the map matches yet. Offer to research it, or to add sources first with neuron_add_source.",
        rule: "The user's definitions win. Cite source titles; for facts from outside their map, give a link and say it is new."
      };
    }
  },
  {
    name: "neuron_writing_guide",
    description: "Get the rhetorical-situation brief to ask the user BEFORE writing anything for them, with guidance and examples for each question, the writing techniques to choose from, and the steps to follow. Call it first whenever the user asks you to write, draft or rewrite something.",
    inputSchema: { type: "object", properties: { lang: { type: "string", enum: ["en", "id"], description: "Language of the guidance; default is the app language" }, preset: { type: "string", enum: ["blog"], description: "'blog' to prefill the brief from the user's blog settings (research-to-post flow)" } } },
    annotations: { readOnlyHint: true },
    run: (a) => {
      const g2 = graph();
      const L = a.lang === "id" || a.lang === "en" ? a.lang : g2.prefs.lang === "id" ? "id" : "en";
      const blog = a.preset === "blog";
      return {
        ...blog ? { blog_steps: BLOG_STEPS, prefilled: blogPreset(g2.profile, g2.blog), blog_format: g2.blog.format, blog: g2.blog, still_ask: ["purpose", "stance", "context", "culture"] } : {},
        learner: g2.profile,
        steps: WORKFLOW,
        brief: ["agents", "conditions", "craft"].map((g3) => ({
          group: GROUPS[g3][L],
          questions: BRIEF.filter((q) => q.group === g3).map((q) => ({ key: q.key, core: q.core, question: q.q[L], why: q.why[L], how_to_answer: q.how[L], examples: q.examples[L], if_user_says_you_choose: q.fallback[L] }))
        })),
        techniques: TECHNIQUES.map((t) => ({ key: t.key, type: KINDS[t.kind][L], name: t.name[L], what: t.what[L], best_for: t.best[L], structure: t.steps[L] })),
        save_with: "neuron_save_writing, passing the answers as brief (keys: " + BRIEF.map((q) => q.key).join(", ") + ")"
      };
    }
  },
  {
    name: "neuron_save_writing",
    description: "Save a finished piece of writing to the user's Neuron (Writing menu) together with its rhetorical brief. Only call after the user agrees. Pass id to save a revision of an earlier piece.",
    inputSchema: {
      type: "object",
      required: ["title", "body", "brief"],
      properties: {
        id: { type: "integer", description: "Id of an earlier piece to update" },
        title: str,
        body: { ...str, description: "The full text, in Markdown" },
        brief: { type: "object", description: "The user's answers, one short line each", properties: Object.fromEntries(BRIEF.map((q) => [q.key, { ...str, description: q.q.en }])) },
        concepts: { type: "array", items: str, description: "Ids or labels of concepts it draws on" },
        lang: { type: "string", enum: ["en", "id"] },
        post: { type: "object", description: "For a blog post: the extra fields of the blog's admin form", properties: {
          slug: { ...str, description: "lowercase-words-with-hyphens, max 80" },
          excerpt: { ...str, description: "Ringkasan, max 300 characters" },
          tags: { ...str, description: "Comma separated, max 200 characters" },
          cover_url: { ...str, description: "Optional image URL, ideally 1200x630" },
          sources: { type: "array", items: { type: "object", required: ["title"], properties: { title: str, url: str } } }
        } }
      }
    },
    run: (a) => {
      const { ids, unknown } = conceptIds(a.concepts);
      const title = String(a.title).trim();
      let post = null;
      const warnings = [];
      if (a.post && typeof a.post === "object") {
        const slug2 = slugify(String(a.post.slug || title));
        const excerpt = String(a.post.excerpt || "").trim(), tags = String(a.post.tags || "").split(",").map((x) => x.trim()).filter(Boolean).join(", ");
        if (title.length > 140) warnings.push(`Title is ${title.length} characters; the blog allows 140.`);
        if (excerpt.length > 300) warnings.push(`Excerpt is ${excerpt.length} characters; the blog allows 300.`);
        if (tags.length > 200) warnings.push(`Tags are ${tags.length} characters; the blog allows 200.`);
        if (/<\/?[a-z][^>]*>/i.test(String(a.body))) warnings.push("The body contains HTML tags; the blog shows them as plain text. Use Markdown instead.");
        if (/\]\((?!https?:|mailto:|\/|#)/i.test(String(a.body))) warnings.push("Some links don't start with https://; the blog drops them.");
        const sources2 = Array.isArray(a.post.sources) ? a.post.sources.map((x) => ({ title: String(x.title || ""), ...x.url ? { url: String(x.url) } : {} })).filter((x) => x.title) : [];
        post = { slug: slug2, excerpt, tags, coverUrl: String(a.post.cover_url || "").trim(), sources: sources2 };
      }
      const id = saveWriting({ id: a.id ? Number(a.id) : null, kind: "writing", title: title.slice(0, 200), body: String(a.body), brief: a.brief || {}, conceptIds: ids, lang: a.lang || null, post });
      return { saved: true, id, linked_concepts: ids, ...post ? { slug: post.slug } : {}, ...warnings.length ? { fix_these: warnings } : {}, ...unknown.length ? { not_found: unknown } : {}, note: post ? "It's in Neuron \u2192 Writing with a Blog post panel: the user copies each field into their blog admin. If fix_these is present, fix it and save again with the same id." : "It's in the Writing menu of the app." };
    }
  },
  {
    name: "neuron_save_discussion",
    description: "Save the result of a discussion with the user as a note in Neuron (Writing menu, Notes). Draft it first, show it to the user, and call this only after they approve. Only include what was actually discussed.",
    inputSchema: {
      type: "object",
      required: ["title", "summary", "key_points"],
      properties: {
        id: { type: "integer", description: "Id of an earlier note to update" },
        title: str,
        summary: { ...str, description: "2-4 sentences: what was discussed and where it ended" },
        key_points: { type: "array", items: str, description: "The main takeaways" },
        user_conclusions: { type: "array", items: str, description: "What the user decided, believes or said in their own words" },
        open_questions: { type: "array", items: str },
        next_steps: { type: "array", items: str },
        concepts: { type: "array", items: str, description: "Ids or labels of concepts the discussion was about" },
        lang: { type: "string", enum: ["en", "id"] }
      }
    },
    run: (a) => {
      const id_ = a.lang === "id";
      const sec = (h, items) => Array.isArray(items) && items.length ? `
## ${id_ ? h[1] : h[0]}
${items.map((x) => `- ${String(x)}`).join("\n")}
` : "";
      const body = `${String(a.summary).trim()}
${sec(["Key points", "Poin utama"], a.key_points)}${sec(["My conclusions", "Kesimpulanku"], a.user_conclusions)}${sec(["Open questions", "Pertanyaan terbuka"], a.open_questions)}${sec(["Next steps", "Langkah berikutnya"], a.next_steps)}`;
      const { ids, unknown } = conceptIds(a.concepts);
      const id = saveWriting({ id: a.id ? Number(a.id) : null, kind: "note", title: String(a.title).slice(0, 200), body, conceptIds: ids, lang: a.lang || null });
      return { saved: true, id, linked_concepts: ids, ...unknown.length ? { not_found: unknown } : {}, note: "It's in the Writing menu, under Notes. Offer to save any definitions, terms or new concepts from the discussion too." };
    }
  },
  {
    name: "neuron_list_writing",
    description: "List saved writing and discussion notes (newest first). Filter by kind, words, or a concept.",
    inputSchema: { type: "object", properties: { kind: { type: "string", enum: ["writing", "note"] }, query: str, concept: str } },
    annotations: { readOnlyHint: true },
    run: (a) => {
      const c = a.concept ? find(graph(), a.concept).id : void 0;
      const list = listWritings({ kind: a.kind, query: a.query ? String(a.query) : void 0, concept: c });
      return { count: list.length, items: list.slice(0, 50).map((w) => ({ id: w.id, kind: w.kind, title: w.title, genre: w.brief.genre || null, updated: iso(w.updatedAt), preview: w.body.slice(0, 160) })) };
    }
  },
  {
    name: "neuron_read_writing",
    description: "Read one saved piece or note in full, with its brief, so you can revise it or continue the discussion.",
    inputSchema: { type: "object", properties: { id: { type: "integer" } }, required: ["id"] },
    annotations: { readOnlyHint: true },
    run: (a) => {
      const w = getWriting(Number(a.id));
      if (!w) throw new Error(`No saved writing with id ${a.id}. Use neuron_list_writing.`);
      return { ...w, created: iso(w.createdAt), updated: iso(w.updatedAt) };
    }
  }
];
var PROMPTS = [
  {
    name: "write",
    title: "Write with Neuron",
    description: "Write something after going through the rhetorical-situation brief (audience, genre, purpose, stance, context, culture...).",
    arguments: [{ name: "topic", description: "What to write about", required: true }, { name: "genre", description: "Optional: essay, LinkedIn post, TikTok script, email..." }],
    text: (a) => `I want to write about: ${a.topic || "(ask me)"}${a.genre ? `
Genre: ${a.genre}` : ""}

Use Neuron: call neuron_writing_guide, look for related concepts on my map, then ask me the brief with guidance and examples for each question before you write anything. Fill in what I've already told you and ask me to confirm it.`
  },
  {
    name: "teach",
    title: "Teach me",
    description: "A lesson toward a goal: Claude checks what you already know, plans the steps, then teaches one at a time with flowcharts, equations and figures, and saves your progress.",
    arguments: [{ name: "goal", description: "What you want to understand", required: true }],
    text: (a) => `Teach me: ${a.goal || "(ask me what I want to learn)"}

Run a Neuron lesson: call neuron_lesson_start with this goal and follow its steps. Probe what I already know first (one question at a time), show me the plan, then teach one step at a time: let me predict, explain with flowcharts, equations, tables or figures where they help, check me, and save each step with neuron_lesson_step.`
  },
  {
    name: "continue_lesson",
    title: "Continue a lesson",
    description: "Pick up the last unfinished lesson where it stopped.",
    arguments: [{ name: "lesson_id", description: "Optional: which lesson" }],
    text: (a) => `Continue my Neuron lesson${a.lesson_id ? ` #${a.lesson_id}` : ""}: call neuron_lesson_get${a.lesson_id ? "" : " (no id, to list them) and pick the most recent unfinished one"}, briefly recap where I am, then teach the next step the same way.`
  },
  {
    name: "blog_post",
    title: "Blog post from my research",
    description: "Turn what your Neuron map has on a topic into a post for your blog, with title, slug, summary, tags and sources.",
    arguments: [{ name: "topic", description: "What the post is about", required: true }],
    text: (a) => `I want a blog post about: ${a.topic || "(ask me)"}

Use my Neuron research: call neuron_research_pack for this topic, then neuron_writing_guide with preset "blog", and follow its blog_steps. Show me what my map covers and what's missing first, confirm the prefilled brief with me, and ask only the open questions, each with guidance and examples. Don't write before I approve the outline.`
  },
  {
    name: "save_discussion",
    title: "Save this discussion",
    description: "Turn the discussion so far into a note in Neuron.",
    arguments: [],
    text: () => "Save the result of our discussion to Neuron. Draft the note first (title, summary, key points, my conclusions, open questions, next steps, related concepts on my map), show it to me, and save it with neuron_save_discussion once I approve. Then tell me which definitions, terms or new concepts could also go into my map."
  },
  {
    name: "analyze_text",
    title: "Read a text critically",
    description: "Analyze a text's rhetorical situation: agents, conditions, organization and verbal/nonverbal elements.",
    arguments: [{ name: "text", description: "The text, or where it's from", required: true }],
    text: (a) => `Read this text critically and rhetorically:

${a.text || "(I'll paste it)"}

Using the brief in neuron_writing_guide as a lens, identify: the originator and the audience (real or anticipated), genre and its conventions, purpose, stance, context, culture, the pattern of organization and how ideas relate, and how verbal and nonverbal elements work together. Then say why it works or fails for its purpose, and what is new, different or weak in it. End with 2 questions to test my understanding.`
  }
];
var send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
var reply = (id, result) => send({ jsonrpc: "2.0", id, result });
var error = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });
async function handle(msg) {
  const { id, method, params } = msg || {};
  if (id === void 0 || id === null) return;
  try {
    switch (method) {
      case "initialize": {
        const v = SUPPORTED.includes(params?.protocolVersion) ? params.protocolVersion : SUPPORTED[0];
        return reply(id, { protocolVersion: v, capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS });
      }
      case "ping":
        return reply(id, {});
      case "tools/list":
        return reply(id, { tools: TOOLS.map(({ run, ...t }) => t) });
      case "tools/call": {
        const tool = TOOLS.find((t) => t.name === params?.name);
        if (!tool) return error(id, -32602, `Unknown tool: ${params?.name}`);
        try {
          const out = await tool.run(params?.arguments || {});
          return reply(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
        } catch (e) {
          return reply(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
        }
      }
      case "resources/list":
        return reply(id, { resources: [] });
      case "prompts/list":
        return reply(id, { prompts: PROMPTS.map(({ text: text2, ...p }) => p) });
      case "prompts/get": {
        const p = PROMPTS.find((x) => x.name === params?.name);
        if (!p) return error(id, -32602, `Unknown prompt: ${params?.name}`);
        return reply(id, { description: p.description, messages: [{ role: "user", content: { type: "text", text: p.text(params?.arguments || {}) } }] });
      }
      default:
        return error(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return error(id, -32603, e.message);
  }
}
var buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      error(null, -32700, "Parse error");
      continue;
    }
    const p = handle(msg);
    pending2.add(p);
    p.finally(() => pending2.delete(p));
  }
});
var pending2 = /* @__PURE__ */ new Set();
process.stdin.on("end", async () => {
  await Promise.allSettled([...pending2]);
  process.exit(0);
});
console.error(`[neuron-mcp] ready, database: ${process.env.NEURON_DATA_DIR}`);
