package MSTEST.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Game {
    public enum MessageType {

        GAME,

        WIN,

        LOSE,

        JOIN,

        LEAVE
    }

    Board bombs;

    Board numbers;

    Board size;

    Boolean isRestarted;

    MessageType type;

    User username;

    User time;

}
