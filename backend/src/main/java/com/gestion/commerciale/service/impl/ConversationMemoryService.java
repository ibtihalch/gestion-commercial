package com.gestion.commerciale.service.impl;

import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConversationMemoryService {

    private static final int MAX_EXCHANGES = 6;
    private static final int MAX_MESSAGE_LENGTH = 1_500;

    private final Map<ConversationKey, Deque<Exchange>> conversations = new ConcurrentHashMap<>();

    public String getHistory(Integer utilisateurId, Integer entrepriseId) {
        Deque<Exchange> exchanges = conversations.get(new ConversationKey(utilisateurId, entrepriseId));
        if (exchanges == null) {
            return "";
        }

        synchronized (exchanges) {
            StringBuilder history = new StringBuilder();
            for (Exchange exchange : exchanges) {
                history.append("Utilisateur : ").append(exchange.userMessage()).append('\n');
                history.append("Assistant : ").append(exchange.assistantReply()).append('\n');
            }
            return history.toString().trim();
        }
    }

    public void addExchange(Integer utilisateurId, Integer entrepriseId,
                            String userMessage, String assistantReply) {
        ConversationKey key = new ConversationKey(utilisateurId, entrepriseId);
        Deque<Exchange> exchanges = conversations.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (exchanges) {
            exchanges.addLast(new Exchange(truncate(userMessage), truncate(assistantReply)));
            while (exchanges.size() > MAX_EXCHANGES) {
                exchanges.removeFirst();
            }
        }
    }

    public void clear(Integer utilisateurId, Integer entrepriseId) {
        conversations.remove(new ConversationKey(utilisateurId, entrepriseId));
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= MAX_MESSAGE_LENGTH ? value : value.substring(0, MAX_MESSAGE_LENGTH);
    }

    private record ConversationKey(Integer utilisateurId, Integer entrepriseId) {}

    private record Exchange(String userMessage, String assistantReply) {}
}
