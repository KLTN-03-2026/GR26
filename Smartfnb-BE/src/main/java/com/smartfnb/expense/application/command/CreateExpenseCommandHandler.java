package com.smartfnb.expense.application.command;

import com.smartfnb.expense.domain.model.Expense;
import com.smartfnb.expense.domain.repository.ExpenseRepository;
import com.smartfnb.shift.infrastructure.persistence.PosSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateExpenseCommandHandler {

    private final ExpenseRepository expenseRepository;
    // author: Hoàng | date: 2026-04-30 | note: Dùng để tự động gắn posSessionId cho expense CASH từ két POS.
    private final PosSessionJpaRepository posSessionJpaRepository;

    @Transactional
    public UUID handle(CreateExpenseCommand command) {
        log.info("Creating new expense for branch {}: amount={}, category={}",
            command.branchId(), command.amount(), command.categoryName());

        // author: Hoàng | date: 2026-04-30 | note: Chỉ gắn posSessionId khi paymentMethod=CASH — chi bằng tiền mặt từ két POS.
        //   Expense chuyển khoản hoặc không phải tiền mặt không ảnh hưởng két POS.
        UUID posSessionId = null;
        if ("CASH".equalsIgnoreCase(command.paymentMethod())) {
            posSessionId = posSessionJpaRepository
                    .findByBranchIdAndStatus(command.branchId(), "OPEN")
                    .map(session -> session.getId())
                    .orElse(null);
            if (posSessionId == null) {
                log.warn("Expense CASH được tạo nhưng không tìm thấy ca POS đang mở cho branch {} — sẽ không trừ vào két POS", command.branchId());
            }
        }

        Expense expense = Expense.create(
            command.tenantId(),
            command.branchId(),
            command.amount(),
            command.categoryName(),
            command.description(),
            command.expenseDate(),
            command.paymentMethod(),
            command.createdBy(),
            posSessionId
        );

        Expense saved = expenseRepository.save(expense);
        return saved.getId();
    }
}
