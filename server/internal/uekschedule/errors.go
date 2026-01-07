package uekschedule

import "errors"

const errPrefix = "uekschedule: "

var ErrUnauthorized = errors.New(errPrefix + "bad auth header")
