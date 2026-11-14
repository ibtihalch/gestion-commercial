package com.gestion.commerciale.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Levée lorsqu'un article ne dispose pas d'un stock suffisant
 * pour honorer les quantités demandées dans un bon de livraison.
 */
@ResponseStatus(HttpStatus.CONFLICT)   // → HTTP 409
public class StockInsuffisantException extends RuntimeException {

    public StockInsuffisantException(String message) {
        super(message);
    }
}