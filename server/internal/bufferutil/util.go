package bufferutil

func EnsureBufferSize(buff []byte, size int) []byte {
	if len(buff) == size {
		return buff
	}

	if cap(buff) >= size {
		return buff[:size]
	}

	return make([]byte, size)
}

func EnsureBufferSizeAtLeast(buff []byte, minSize int) []byte {
	if len(buff) >= minSize {
		return buff
	}

	if cap(buff) >= minSize {
		return buff[:cap(buff)]
	}

	return make([]byte, minSize)
}
