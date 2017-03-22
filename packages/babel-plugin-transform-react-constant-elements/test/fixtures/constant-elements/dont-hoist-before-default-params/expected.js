function render(Component) {
  var text = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var _ref = <Component text={text} />;

  return function () {
    return _ref;
  };
}
