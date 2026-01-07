package bufferutil_test

import (
	"testing"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/bufferutil"
)

func TestBufferPoolRespectsInitialSize(t *testing.T) {
	const initialSize = 16 * 1024

	pool := bufferutil.NewBufferPool(initialSize)

	buff := pool.Get()
	buffLen := len(buff)

	if buffLen != initialSize {
		t.Errorf("Returned buffer size other than requested, got: %d, want: %d", buffLen, initialSize)
	}
}

func TestBufferPoolReturnsEmptyBuff(t *testing.T) {
	const initialSize = 16 * 1024

	pool := bufferutil.NewBufferPool(initialSize)

	buff := pool.GetEmpty()
	buffLen := len(buff)

	if buffLen != 0 {
		t.Errorf("Returned buffer is not empty, got length: %d", buffLen)
	}
}

func TestBufferPoolReusesBuffs(t *testing.T) {
	const initialSize = 16 * 1024
	const resizedSize = 2137

	pool := bufferutil.NewBufferPool(initialSize)

	{
		buff := pool.Get()
		buff = buff[:resizedSize]
		pool.Put(buff)
	}

	buff := pool.Get()
	buffLen := len(buff)

	if buffLen != resizedSize {
		t.Errorf("Returned buffer is fresh, got length: %d, want: %d", buffLen, resizedSize)
	}
}
