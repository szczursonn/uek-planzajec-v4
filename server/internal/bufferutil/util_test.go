package bufferutil_test

import (
	"testing"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/bufferutil"
)

func TestEnsureBufferSizeExpandIntoNewArray(t *testing.T) {
	const initialSize = 10
	const initialCapacity = 20
	const targetSize = 50

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSize(buff, targetSize)
	buffLen := len(buff)

	if buffLen != targetSize {
		t.Errorf("Buffer was not resized to specified size, got: %d, want: %d", buffLen, targetSize)
	}
}

func TestEnsureBufferSizeExpandIntoExistingArray(t *testing.T) {
	const initialSize = 10
	const initialCapacity = 50
	const targetSize = 50

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSize(buff, targetSize)
	buffLen, buffCap := len(buff), cap(buff)

	if buffLen != targetSize {
		t.Errorf("Buffer was not resized to specified size, got: %d, want: %d", buffLen, targetSize)
	}

	if buffCap != initialCapacity {
		t.Errorf("Buffer capacity changed unexpectedly, got: %d, want: %d", buffCap, initialCapacity)
	}
}

func TestEnsureBufferSizeTruncate(t *testing.T) {
	const initialSize = 40
	const initialCapacity = 50
	const targetSize = 10

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSize(buff, targetSize)
	buffLen, buffCap := len(buff), cap(buff)

	if buffLen != targetSize {
		t.Errorf("Buffer was not resized to specified size, got: %d, want: %d", buffLen, targetSize)
	}

	if buffCap != initialCapacity {
		t.Errorf("Buffer capacity changed unexpectedly, got: %d, want: %d", buffCap, initialCapacity)
	}
}

func TestEnsureBufferSizeNoop(t *testing.T) {
	const initialSize = 10
	const initialCapacity = 10

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSize(buff, initialSize)
	buffLen, buffCap := len(buff), cap(buff)

	if buffLen != initialSize {
		t.Errorf("Buffer size changed unexpectedly, got: %d, want: %d", buffLen, initialSize)
	}

	if buffCap != initialCapacity {
		t.Errorf("Buffer capacity changed unexpectedly, got: %d, want: %d", buffCap, initialCapacity)
	}
}

func TestEnsureBufferSizeAtLeastExpandIntoNewArray(t *testing.T) {
	const initialSize = 10
	const initialCapacity = 20
	const targetMinSize = 30

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSizeAtLeast(buff, targetMinSize)
	buffLen := len(buff)

	if buffLen < targetMinSize {
		t.Errorf("Buffer was not resized to at least specified size, got: %d, want at least: %d", buffLen, targetMinSize)
	}
}

func TestEnsureBufferSizeAtLeastExpandIntoExistingArray(t *testing.T) {
	const initialSize = 10
	const initialCapacity = 20
	const targetMinSize = 15

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSizeAtLeast(buff, targetMinSize)
	buffLen, buffCap := len(buff), cap(buff)

	if buffLen < targetMinSize {
		t.Errorf("Buffer was not resized to at least specified size, got: %d, want at least: %d", buffLen, targetMinSize)
	}

	if buffCap != initialCapacity {
		t.Errorf("Buffer capacity changed unexpectedly, got: %d, want: %d", buffCap, initialCapacity)
	}
}

func TestEnsureBufferSizeAtLeastNoop(t *testing.T) {
	const initialSize = 10
	const initialCapacity = 10
	const targetMinSize = 10

	buff := make([]byte, initialSize, initialCapacity)
	buff = bufferutil.EnsureBufferSizeAtLeast(buff, targetMinSize)
	buffLen, buffCap := len(buff), cap(buff)

	if buffLen != initialSize {
		t.Errorf("Buffer size changed unexpectedly, got: %d, want: %d", buffLen, initialSize)
	}

	if buffCap != initialCapacity {
		t.Errorf("Buffer capacity changed unexpectedly, got: %d, want: %d", buffCap, initialCapacity)
	}
}
