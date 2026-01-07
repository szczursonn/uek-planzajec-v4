package server

import (
	"net/http"
)

func (srv *Server) handleRequestAuthEncryptBasicAuth(w http.ResponseWriter, r *http.Request, basicAuthValue string) {
	encryptedBasicAuthValue, err := srv.encryption.EncryptText(basicAuthValue)
	if err != nil {
		respondBadRequest(w)
		return
	}

	w.WriteHeader(http.StatusCreated)
	respondJSON(w, struct {
		Token string `json:"token"`
	}{
		Token: encryptedBasicAuthValue,
	})
}
