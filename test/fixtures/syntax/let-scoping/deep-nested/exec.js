var a = 'var a';
{
  var b = 'var b';
  {
    var c = 'var c';
    let d = 'let d';
    assert.equal(d, 'let d');
  }
  assert.throws(function () {
    d;
  }, /d is not defined/);
}
