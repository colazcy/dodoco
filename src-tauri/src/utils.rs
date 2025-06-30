pub struct ProgressEmitter<'a> {
    interval: u64,
    next: u64,
    cur: u64,
    emit: &'a dyn Fn(u64),
}

impl<'a> ProgressEmitter<'a> {
    pub fn new(interval: u64, emit: &'a dyn Fn(u64)) -> Self {
        Self {
            interval,
            next: interval,
            cur: 0,
            emit,
        }
    }
    pub fn inc(&mut self, delta: u64) {
        self.cur += delta;
        if self.cur >= self.next {
            self.next = self.cur + self.interval;
            (self.emit)(self.cur);
        }
    }
}
