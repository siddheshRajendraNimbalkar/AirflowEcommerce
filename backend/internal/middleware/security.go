package middleware

import (
	"github.com/gin-contrib/secure"
	"github.com/gin-gonic/gin"
)

func SecurityMiddleware() gin.HandlerFunc {
	return secure.New(secure.Config{
		FrameDeny:         true,
		ContentTypeNosniff: true,
		BrowserXssFilter:  true,
	})
}