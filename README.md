```
sum(a: int, b: int): int
  return a + b

sum(values: List<Int>): int
  return values

plus_one(a: int): int
  return a + 1

if(1 + 2 * 3)
  if(true)
    let a = "hello mama"
    let c = a
    let c = false
    let k = c
else
  let a = 1
let a = false
```

becomes

```c
int sum(int a, int b) {
  return a + b;
}
int sum(List<Int> values) {
  return values;
}
int plus_one(int a) {
  return a + 1;
}
if(1 + 2 * 3) {
  if(true) {
    char* a = "hello mama";
    char* c = a;
    int c = false;
    int k = c;
  }
}
int a = false;
```