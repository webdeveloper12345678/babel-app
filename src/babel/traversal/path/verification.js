import includes from "lodash/collection/includes";
import * as t from "../../types";

/**
 * Match the current node if it matches the provided `pattern`.
 *
 * For example, given the match `React.createClass` it would match the
 * parsed nodes of `React.createClass` and `React["createClass"]`.
 */

export function matchesPattern(pattern: string, allowPartial?: boolean): boolean {
 var parts = pattern.split(".");

  // not a member expression
  if (!this.isMemberExpression()) return false;

  var search = [this.node];
  var i = 0;

  function matches(name) {
    var part = parts[i];
    return part === "*" || name === part;
  }

  while (search.length) {
    var node = search.shift();

    if (allowPartial && i === parts.length) {
      return true;
    }

    if (t.isIdentifier(node)) {
      // this part doesn't match
      if (!matches(node.name)) return false;
    } else if (t.isLiteral(node)) {
      // this part doesn't match
      if (!matches(node.value)) return false;
    } else if (t.isMemberExpression(node)) {
      if (node.computed && !t.isLiteral(node.property)) {
        // we can't deal with this
        return false;
      } else {
        search.push(node.object);
        search.push(node.property);
        continue;
      }
    } else {
      // we can't deal with this
      return false;
    }

    // too many parts
    if (++i > parts.length) {
      return false;
    }
  }

  return true;
}

/**
 * Check whether we have the input `key`. If the `key` references an array then we check
 * if the array has any items, otherwise we just check if it's falsy.
 */

export function has(key): boolean {
  var val = this.node[key];
  if (val && Array.isArray(val)) {
    return !!val.length;
  } else {
    return !!val;
  }
}

/**
 * Alias of `has`.
 */

export var is = has;

/**
 * Opposite of `has`.
 */

export function isnt(key): boolean {
  return !this.has(key);
}

/**
 * Check whether the path node `key` strict equals `value`.
 */

export function equals(key, value): boolean {
  return this.node[key] === value;
}

/**
 * Check the type against our stored internal type of the node. This is handy when a node has
 * been removed yet we still internally know the type and need it to calculate node replacement.
 */

export function isNodeType(type: string): boolean {
  return t.isType(this.type, type);
}

/**
 * This checks whether or now we're in one of the following positions:
 *
 *   for (KEY in right);
 *   for (KEY;;);
 *
 * This is because these spots allow VariableDeclarations AND normal expressions so we need
 * to tell the path replacement that it's ok to replace this with an expression.
 */

 export function canHaveVariableDeclarationOrExpression() {
    return (this.key === "init" || this.key === "left") && this.parentPath.isFor();
 }

/**
 * Check whether the current path references a completion record
 */

export function isCompletionRecord(allowInsideFunction?) {
  var path = this;
  var first = true;

  do {
    var container = path.container;

    // we're in a function so can't be a completion record
    if (path.isFunction() && !first) {
      return !!allowInsideFunction;
    }

    first = false;

    // check to see if we're the last item in the container and if we are
    // we're a completion record!
    if (Array.isArray(container) && path.key !== container.length - 1) {
      return false;
    }
  } while ((path = path.parentPath) && !path.isProgram());

  return true;
}

/**
 * Check whether or not the current `key` allows either a single statement or block statement
 * so we can explode it if necessary.
 */

export function isStatementOrBlock() {
  if (t.isLabeledStatement(this.parent) || t.isBlockStatement(this.container)) {
    return false;
  } else {
    return includes(t.STATEMENT_OR_BLOCK_KEYS, this.key);
  }
}

/**
 * Check whether this node was a part of the original AST.
 */

export function isUser() {
  return this.node && !!this.node.loc;
}

/**
 * Check whether this node was generated by us and not a part of the original AST.
 */

export function isGenerated() {
  return !this.isUser();
}

/**
 * Check if the currently assigned path references the `importName` of `moduleSource`.
 */

export function referencesImport(moduleSource, importName) {
  if (!this.isReferencedIdentifier()) return false;

  var binding = this.scope.getBinding(this.node.name);
  if (!binding || binding.kind !== "module") return false;

  var path = binding.path;
  if (!path.isImportDeclaration()) return false;

  // check moduleSource
  if (path.node.source.value === moduleSource) {
    if (!importName) return true;
  } else {
    return false;
  }

  for (var specifier of (path.node.specifiers: Array)) {
    if (t.isSpecifierDefault(specifier) && importName === "default") {
      return true;
    }

    if (t.ImportNamespaceSpecifier(specifier) && importName === "*") {
      return true;
    }

    if (t.isImportSpecifier(specifier) && specifier.imported.name === importName) {
      return true;
    }
  }

  return false;
}
