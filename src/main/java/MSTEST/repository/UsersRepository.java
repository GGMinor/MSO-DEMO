package MSTEST.repository;

import MSTEST.model.UsersModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface UsersRepository extends JpaRepository<UsersModel, Integer> {

    Optional<UsersModel> findByLoginAndPassword(String login, String password);

    Optional<UsersModel> findByLogin(String login);
    UsersModel findUserByLogin (String login);

}
