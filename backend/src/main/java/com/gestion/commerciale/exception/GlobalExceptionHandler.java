package com.gestion.commerciale.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return response(false, ex.getMessage(), null, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return response(false, ex.getMessage(), null, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String message = "Violation de contrainte d'unicité";
        String cause = ex.getMostSpecificCause().getMessage();

        if (cause.contains("uk_client_nom") || cause.contains("uk_fournisseur_nom"))
            message = "Un enregistrement avec ce nom existe déjà";
        else if (cause.contains("uk_client_email") || cause.contains("uk_fournisseur_email"))
            message = "Un enregistrement avec cet email existe déjà";
        else if (cause.contains("uk_client_ice") || cause.contains("uk_fournisseur_ice"))
            message = "Un enregistrement avec cet ICE existe déjà";
        else if (cause.toLowerCase().contains("facture_client"))
            message = "Le numéro de facture client existe déjà. Veuillez réessayer";

        return response(false, message, null, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            errors.put(field, error.getDefaultMessage());
        });
        return response(false, "Erreur de validation", errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return response(false, "Login ou mot de passe incorrect", null, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return response(false, "Accès refusé", null, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        ex.printStackTrace(); // ← affiche le vrai stack trace dans le terminal backend
        return response(false, "Erreur serveur : " + ex.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<Map<String, Object>> response(boolean success, String message,
                                                          Object data, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", success);
        body.put("message", message);
        body.put("status", status.value());
        if (data != null) body.put("data", data);
        return new ResponseEntity<>(body, status);
    }
}
