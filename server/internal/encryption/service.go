package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/bufferutil"
)

type Service struct {
	gcm        cipher.AEAD
	bufferPool *bufferutil.BufferPool
}

func NewService(encryptionKey []byte, bufferPool *bufferutil.BufferPool) (*Service, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	return &Service{
		gcm:        gcm,
		bufferPool: bufferPool,
	}, nil
}

func (s *Service) Encrypt(plainBuff []byte) ([]byte, error) {
	nonceBuff := s.bufferPool.Get()
	defer s.bufferPool.Put(nonceBuff)

	nonceBuff = bufferutil.EnsureBufferSize(nonceBuff, s.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonceBuff); err != nil {
		return nil, err
	}

	cipherBuff := s.bufferPool.GetEmpty()
	defer s.bufferPool.Put(cipherBuff)

	cipherBuff = append(cipherBuff, nonceBuff...)
	cipherBuff = s.gcm.Seal(cipherBuff, nonceBuff, plainBuff, nil)

	return cipherBuff, nil
}

func (s *Service) EncryptText(plainText string) (string, error) {
	cipherBuff, err := s.Encrypt([]byte(plainText))
	if err != nil {
		return "", err
	}

	return base64.URLEncoding.EncodeToString(cipherBuff), nil
}

func (s *Service) Decrypt(cipherBuff []byte) ([]byte, error) {
	nonceSize := s.gcm.NonceSize()
	if len(cipherBuff) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce := cipherBuff[:nonceSize]
	ciphertext := cipherBuff[nonceSize:]

	plainBuff := s.bufferPool.GetEmpty()
	defer s.bufferPool.Put(plainBuff)

	return s.gcm.Open(plainBuff, nonce, ciphertext, nil)
}

func (s *Service) DecryptText(cipherText string) (string, error) {
	cipherBuff := s.bufferPool.Get()
	defer s.bufferPool.Put(cipherBuff)

	cipherBuff = bufferutil.EnsureBufferSizeAtLeast(cipherBuff, base64.URLEncoding.DecodedLen(len(cipherText)))
	n, err := base64.URLEncoding.Decode(cipherBuff, []byte(cipherText))
	if err != nil {
		return "", err
	}
	cipherBuff = cipherBuff[:n]

	plainBuff, err := s.Decrypt(cipherBuff)
	if err != nil {
		return "", err
	}

	return string(plainBuff), nil
}
