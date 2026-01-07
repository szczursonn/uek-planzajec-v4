package encryption_test

import (
	"testing"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/bufferutil"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/encryption"
)

var testEncryptionKey1 = []byte("g0ZH6qmSSVPSik/0N35xLl1ve1nWJHI=")
var testEncryptionKey2 = []byte("0N35xLl1ve1nWJHI/g0ZH6qmSSVPSik=")

const textToEncrypt = "87f374f93f78dm89swd7293dh2db7sbfd7wbf768ds78fbdsfb29bd28d2 hd29d 9xx🥀"

func TestServiceEncryptDecrypt(t *testing.T) {
	service, err := encryption.NewService(testEncryptionKey1, bufferutil.NewBufferPool(8*1024))
	if err != nil {
		t.Errorf("Failed to create encryption service: %s", err)
		return
	}

	encryptedText, err := service.EncryptText(textToEncrypt)
	if err != nil {
		t.Errorf("Failed to encrypt text: %s", err)
		return
	}

	decryptedText, err := service.DecryptText(encryptedText)
	if err != nil {
		t.Errorf("Failed to decrypt text: %s", err)
		return
	}

	if decryptedText != textToEncrypt {
		t.Errorf("Decrypted text does not match original, got: %s, want: %s", decryptedText, textToEncrypt)
	}
}

func TestServiceEncryptDecryptKeyMismatch(t *testing.T) {
	service1, err := encryption.NewService(testEncryptionKey1, bufferutil.NewBufferPool(8*1024))
	if err != nil {
		t.Errorf("Failed to create encryption service 1: %s", err)
		return
	}

	encryptedText, err := service1.EncryptText(textToEncrypt)
	if err != nil {
		t.Errorf("Failed to encrypt text: %s", err)
		return
	}

	service2, err := encryption.NewService(testEncryptionKey2, bufferutil.NewBufferPool(8*1024))
	if err != nil {
		t.Errorf("Failed to create encryption service 2: %s", err)
		return
	}

	if _, err := service2.DecryptText(encryptedText); err == nil {
		t.Error("Should return an error if encrypted using a different key")
		return
	}
}
