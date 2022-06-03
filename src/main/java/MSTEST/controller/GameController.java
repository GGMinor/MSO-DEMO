package MSTEST.controller;

import MSTEST.model.Board;
import MSTEST.model.Game;
import MSTEST.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.util.HashMap;

import static java.lang.String.format;

@Controller
public class GameController {
    static HashMap<String, Game> game = new HashMap<String, Game>();

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @MessageMapping("/game/{roomId}/joinToTheGame")
    public void joinToTheGame(@DestinationVariable String roomId) {
        if (!game.containsKey(roomId)) {
            game.put(roomId, new Game());
            Game ongoingGame = game.get(roomId);
        }
        Game ongoingGame = game.get(roomId);
        ongoingGame.setType(Game.MessageType.JOIN);
        // is in the process of disarming
        messagingTemplate.convertAndSend(format("/game/%s", roomId), ongoingGame);
    }

    @MessageMapping("/game/{roomId}/sendBoard")
    public void sendBoard(@DestinationVariable String roomId, @Payload Board bombs,@Payload Board numbers, @Payload Board size ){
        Game ongoingGame = game.get(roomId);
        System.out.println("ongoingGame " + game.get(roomId));
        ongoingGame.setBombs(bombs);
        ongoingGame.setNumbers(numbers);
        ongoingGame.setSize(size);
        ongoingGame.setType(Game.MessageType.GAME);
        messagingTemplate.convertAndSend(format("/game/%s", roomId), ongoingGame);

    }
    @MessageMapping("/game/{roomId}/sendWin")
    public void sendWin(@DestinationVariable String roomId, @Payload User username, @Payload User time){
        Game ongoingGame = game.get(roomId);
        ongoingGame.setUsername(username);
        ongoingGame.setTime(time);
        ongoingGame.setType(Game.MessageType.WIN);
        messagingTemplate.convertAndSend(format("/game/%s", roomId), ongoingGame);

    }

    @MessageMapping("/game/{roomId}/sendLose")
    public void sendLose(@DestinationVariable String roomId, @Payload User username){
        System.out.println("ongoingGame loss " + game.get(roomId));
        Game ongoingGame = game.get(roomId);
        ongoingGame.setUsername(username);
        ongoingGame.setType(Game.MessageType.LOSE);
        messagingTemplate.convertAndSend(format("/game/%s", roomId), ongoingGame);
    }
}
