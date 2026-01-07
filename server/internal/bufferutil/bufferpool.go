package bufferutil

import "sync"

type BufferPool struct {
	pool sync.Pool
}

func NewBufferPool(initialSize int) *BufferPool {
	return &BufferPool{
		pool: sync.Pool{
			New: func() any {
				buff := make([]byte, initialSize)
				return &buff
			},
		},
	}
}

func (bp *BufferPool) Get() []byte {
	return *bp.pool.Get().(*[]byte)
}

func (bp *BufferPool) GetEmpty() []byte {
	return bp.Get()[:0]
}

func (bp *BufferPool) Put(buff []byte) {
	bp.pool.Put(&buff)
}
